"use server";

import { randomUUID } from "crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, withDbTimeout } from "@/lib/db";
import {
  EQUIPMENT_DECLARATION_TEXT,
  EQUIPMENT_DECLARATION_VERSION,
} from "@/lib/peralatan/declaration";
import {
  encryptMykad,
  hashAuditValue,
  normalizeMykad,
} from "@/lib/peralatan/mykad";
import { listEquipmentLoansByContact } from "@/lib/peralatan/queries";
import { buildEquipmentLookupWhatsAppUrl } from "@/lib/peralatan/lookup-whatsapp";
import type { EquipmentLoanLookupResult } from "@/lib/peralatan/types";
import { buildEquipmentRequestWhatsAppUrl } from "@/lib/peralatan/whatsapp";
import {
  equipmentCategories,
  equipmentLoanEvents,
  equipmentLoanItems,
  equipmentLoanRequests,
  equipmentTypes,
  equipmentUnits,
  pkgs,
  schools,
} from "@/lib/schema";
import { normalizePhoneNumber } from "@/lib/tempahan/booking-rules";

function isDbTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Pangkalan data tidak bertindak balas")
  );
}

const requestedItemsSchema = z
  .array(
    z.object({
      equipmentCategoryId: z.string().uuid(),
      quantity: z.number().int().min(1).max(120),
    }),
  )
  .min(1)
  .max(20);

export type EquipmentApplicationState = {
  ok: boolean;
  message: string;
  referenceNo?: string;
  whatsappUrl?: string;
};

function formText(formData: FormData, key: string, max = 500): string {
  return String(formData.get(key) ?? "")
    .trim()
    .slice(0, max);
}

async function resolveBaseUrl(): Promise<string> {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const requestHeaders = await headers();
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  return `${proto}://${host}`;
}

export async function createEquipmentLoanAction(
  _previousState: EquipmentApplicationState,
  formData: FormData,
): Promise<EquipmentApplicationState> {
  const pkgId = formText(formData, "pkgId", 80);
  const applicantType = formText(formData, "applicantType", 20);
  const schoolCode = formText(formData, "schoolCode", 20);
  const enteredOrgName = formText(formData, "orgName", 300);
  const applicantName = formText(formData, "applicantName", 200);
  const position = formText(formData, "position", 200);
  const contact = formText(formData, "contact", 30);
  const contactNormalized = normalizePhoneNumber(contact);
  const applicantMykad = normalizeMykad(formText(formData, "applicantMykad", 20));
  const declarationAccepted =
    formText(formData, "declarationAccepted", 10) === "yes";
  const purpose = formText(formData, "purpose", 1000);
  const usageLocation = formText(formData, "usageLocation", 500);
  const borrowDate = formText(formData, "borrowDate", 20);
  const expectedReturnDate = formText(formData, "expectedReturnDate", 20);

  if (applicantType !== "sekolah" && applicantType !== "pegawai") {
    return { ok: false, message: "Jenis pemohon tidak sah." };
  }
  if (
    !pkgId ||
    !applicantName ||
    !position ||
    !contactNormalized ||
    !/^\d{12}$/.test(applicantMykad) ||
    !declarationAccepted ||
    !purpose ||
    !usageLocation
  ) {
    return {
      ok: false,
      message:
        !/^\d{12}$/.test(applicantMykad)
          ? "Masukkan nombor MyKad pemohon yang sah (12 digit)."
          : !declarationAccepted
            ? "Sila baca dan setuju dengan Akuan Pemohon."
            : "Sila lengkapkan semua maklumat permohonan.",
    };
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(borrowDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(expectedReturnDate) ||
    expectedReturnDate < borrowDate
  ) {
    return { ok: false, message: "Tempoh pinjaman tidak sah." };
  }

  let requestedItems: z.infer<typeof requestedItemsSchema>;
  try {
    requestedItems = requestedItemsSchema.parse(
      JSON.parse(formText(formData, "items", 10_000)),
    );
  } catch {
    return { ok: false, message: "Sila pilih sekurang-kurangnya satu peralatan." };
  }

  const uniqueCategoryIds = new Set(
    requestedItems.map((item) => item.equipmentCategoryId),
  );
  if (uniqueCategoryIds.size !== requestedItems.length) {
    return { ok: false, message: "Senarai peralatan mengandungi item berulang." };
  }

  try {
    // Sequential + timeout: Promise.all on ~3 pooler slots previously hung pages
    // for the full Vercel budget when a socket was dead.
    const pkg = await withDbTimeout(
      db.query.pkgs.findFirst({
        where: and(eq(pkgs.id, pkgId), eq(pkgs.active, true)),
      }),
    );
    const categoryRows = await withDbTimeout(
      db
        .select({ id: equipmentCategories.id })
        .from(equipmentCategories)
        .where(
          and(
            inArray(equipmentCategories.id, [...uniqueCategoryIds]),
            eq(equipmentCategories.active, true),
          ),
        ),
    );
    const typeRows = await withDbTimeout(
      db
        .select({
          id: equipmentTypes.id,
          categoryId: equipmentTypes.categoryId,
        })
        .from(equipmentTypes)
        .where(
          and(
            inArray(equipmentTypes.categoryId, [...uniqueCategoryIds]),
            eq(equipmentTypes.active, true),
          ),
        )
        .orderBy(asc(equipmentTypes.sortOrder)),
    );
    const availableRows = await withDbTimeout(
      db
        .select({ categoryId: equipmentTypes.categoryId })
        .from(equipmentUnits)
        .innerJoin(
          equipmentTypes,
          eq(equipmentUnits.equipmentTypeId, equipmentTypes.id),
        )
        .where(
          and(
            eq(equipmentUnits.pkgId, pkgId),
            eq(equipmentUnits.status, "available"),
            inArray(equipmentTypes.categoryId, [...uniqueCategoryIds]),
            eq(equipmentTypes.active, true),
          ),
        ),
    );
    const representativeTypeByCategory = new Map<string, string>();
    for (const type of typeRows) {
      if (!representativeTypeByCategory.has(type.categoryId)) {
        representativeTypeByCategory.set(type.categoryId, type.id);
      }
    }
    if (
      !pkg ||
      categoryRows.length !== requestedItems.length ||
      representativeTypeByCategory.size !== requestedItems.length
    ) {
      return { ok: false, message: "PKG atau peralatan yang dipilih tidak sah." };
    }

    const availableCount = new Map<string, number>();
    for (const row of availableRows) {
      availableCount.set(
        row.categoryId,
        (availableCount.get(row.categoryId) ?? 0) + 1,
      );
    }
    const unavailable = requestedItems.some(
      (item) =>
        item.quantity > (availableCount.get(item.equipmentCategoryId) ?? 0),
    );
    if (unavailable) {
      return {
        ok: false,
        message: "Stok telah berubah. Sila semak kuantiti peralatan sekali lagi.",
      };
    }

    let orgName = enteredOrgName;
    let resolvedSchoolCode: string | null = null;
    if (applicantType === "sekolah") {
      const school = schoolCode
        ? await withDbTimeout(
            db.query.schools.findFirst({ where: eq(schools.code, schoolCode) }),
          )
        : null;
      if (!school) return { ok: false, message: "Sila pilih sekolah yang sah." };
      orgName = school.name;
      resolvedSchoolCode = school.code;
    } else if (!orgName) {
      return { ok: false, message: "Sila isi bahagian atau unit pemohon." };
    }

    const requestId = randomUUID();
    const referenceNo = `PP-${new Date().getFullYear()}-${requestId
      .slice(0, 8)
      .toUpperCase()}`;
    const declarationAcceptedAt = new Date();
    const requestHeaders = await headers();
    const forwardedIp = (
      requestHeaders.get("x-forwarded-for") ??
      requestHeaders.get("x-real-ip") ??
      ""
    )
      .split(",")[0]
      .trim();

    await withDbTimeout(
      db.transaction(async (tx) => {
        await tx.insert(equipmentLoanRequests).values({
          id: requestId,
          referenceNo,
          pkgId,
          applicantType,
          schoolCode: resolvedSchoolCode,
          orgName,
          applicantName,
          position,
          contact,
          contactNormalized,
          applicantMykadEncrypted: encryptMykad(applicantMykad),
          applicantMykadLast4: applicantMykad.slice(-4),
          declarationVersion: EQUIPMENT_DECLARATION_VERSION,
          declarationText: EQUIPMENT_DECLARATION_TEXT,
          declarationAcceptedAt,
          purpose,
          usageLocation,
          borrowDate,
          expectedReturnDate,
        });
        await tx.insert(equipmentLoanItems).values(
          requestedItems.map((item) => ({
            requestId,
            categoryId: item.equipmentCategoryId,
            equipmentTypeId: representativeTypeByCategory.get(
              item.equipmentCategoryId,
            )!,
            quantity: item.quantity,
          })),
        );
        await tx.insert(equipmentLoanEvents).values({
          requestId,
          action: "application_created",
          details: {
            applicantType,
            itemCount: requestedItems.length,
            declarationAccepted: true,
            declarationVersion: EQUIPMENT_DECLARATION_VERSION,
            declarationAcceptedAt: declarationAcceptedAt.toISOString(),
            captureMethod: "application_checkbox",
            ipHash: hashAuditValue(forwardedIp),
            userAgent: (requestHeaders.get("user-agent") ?? "").slice(0, 300),
          },
        });
      }),
    );

    const baseUrl = await resolveBaseUrl();
    const managerPhone = pkg.equipmentManagerPhone ?? pkg.whatsappAdminPhone ?? "";
    const whatsappUrl = managerPhone
      ? buildEquipmentRequestWhatsAppUrl(managerPhone, {
          referenceNo,
          applicantName,
          orgName,
          borrowDate,
          expectedReturnDate,
          approvalUrl: `${baseUrl}/admin/peralatan/${pkgId}/permohonan/${requestId}`,
        })
      : "";

    revalidatePath("/tempahan/peralatan");
    revalidatePath(`/admin/peralatan/${pkgId}`);
    revalidatePath(`/admin/peralatan/${pkgId}/permohonan`);
    revalidatePath("/admin/peralatan");
    return {
      ok: true,
      message:
        "Permohonan berjaya dihantar. Sila tunggu kelulusan pentadbir dan gunakan Semak Permohonan untuk menyemak status.",
      referenceNo,
      whatsappUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isDbTimeoutError(error)) {
      return {
        ok: false,
        message:
          "Pangkalan data mengambil masa terlalu lama. Sila cuba semula sebentar lagi.",
      };
    }
    if (message.includes("equipment_")) {
      return {
        ok: false,
        message:
          "Modul peralatan belum diaktifkan dalam pangkalan data. Hubungi pentadbir.",
      };
    }
    return { ok: false, message: "Permohonan tidak dapat disimpan. Cuba semula." };
  }
}

export type EquipmentLookupState = {
  ok: boolean;
  message: string;
  requests: EquipmentLoanLookupResult[];
};

export async function checkEquipmentLoansAction(
  _previousState: EquipmentLookupState,
  formData: FormData,
): Promise<EquipmentLookupState> {
  const contact = normalizePhoneNumber(formText(formData, "contact", 30));
  if (!contact) {
    return {
      ok: false,
      message: "Sila masukkan nombor telefon yang digunakan semasa memohon.",
      requests: [],
    };
  }
  try {
    const requests = await withDbTimeout(listEquipmentLoansByContact(contact));
    const baseUrl = await resolveBaseUrl();
    return {
      ok: true,
      message:
        requests.length > 0
          ? "Permohonan dijumpai."
          : "Tiada permohonan dijumpai untuk nombor telefon ini.",
      requests: requests.map(({ managerPhone, applicantName, pkgId, ...request }) => ({
        ...request,
        whatsappUrl: buildEquipmentLookupWhatsAppUrl(
          { ...request, managerPhone, applicantName, pkgId },
          baseUrl,
        ),
      })),
    };
  } catch (error) {
    return {
      ok: false,
      message: isDbTimeoutError(error)
        ? "Pangkalan data mengambil masa terlalu lama. Sila cuba semula sebentar lagi."
        : "Permohonan tidak dapat disemak. Sila cuba semula.",
      requests: [],
    };
  }
}
