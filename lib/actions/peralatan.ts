"use server";

import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { buildEquipmentRequestWhatsAppUrl } from "@/lib/peralatan/whatsapp";
import {
  equipmentLoanEvents,
  equipmentLoanItems,
  equipmentLoanRequests,
  equipmentTypes,
  equipmentUnits,
  pkgs,
  schools,
} from "@/lib/schema";
import { normalizePhoneNumber } from "@/lib/tempahan/booking-rules";

const requestedItemsSchema = z
  .array(
    z.object({
      equipmentTypeId: z.string().uuid(),
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
    !purpose ||
    !usageLocation
  ) {
    return { ok: false, message: "Sila lengkapkan semua maklumat permohonan." };
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

  const uniqueTypeIds = new Set(requestedItems.map((item) => item.equipmentTypeId));
  if (uniqueTypeIds.size !== requestedItems.length) {
    return { ok: false, message: "Senarai peralatan mengandungi item berulang." };
  }

  try {
    const [pkg, typeRows, availableRows] = await Promise.all([
      db.query.pkgs.findFirst({
        where: and(eq(pkgs.id, pkgId), eq(pkgs.active, true)),
      }),
      db
        .select({ id: equipmentTypes.id })
        .from(equipmentTypes)
        .where(
          and(
            inArray(equipmentTypes.id, [...uniqueTypeIds]),
            eq(equipmentTypes.active, true),
          ),
        ),
      db
        .select({ equipmentTypeId: equipmentUnits.equipmentTypeId })
        .from(equipmentUnits)
        .where(
          and(
            eq(equipmentUnits.pkgId, pkgId),
            eq(equipmentUnits.status, "available"),
            inArray(equipmentUnits.equipmentTypeId, [...uniqueTypeIds]),
          ),
        ),
    ]);
    if (!pkg || typeRows.length !== requestedItems.length) {
      return { ok: false, message: "PKG atau peralatan yang dipilih tidak sah." };
    }

    const availableCount = new Map<string, number>();
    for (const row of availableRows) {
      availableCount.set(
        row.equipmentTypeId,
        (availableCount.get(row.equipmentTypeId) ?? 0) + 1,
      );
    }
    const unavailable = requestedItems.some(
      (item) => item.quantity > (availableCount.get(item.equipmentTypeId) ?? 0),
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
        ? await db.query.schools.findFirst({ where: eq(schools.code, schoolCode) })
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

    await db.transaction(async (tx) => {
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
        purpose,
        usageLocation,
        borrowDate,
        expectedReturnDate,
      });
      await tx.insert(equipmentLoanItems).values(
        requestedItems.map((item) => ({
          requestId,
          equipmentTypeId: item.equipmentTypeId,
          quantity: item.quantity,
        })),
      );
      await tx.insert(equipmentLoanEvents).values({
        requestId,
        action: "application_created",
        details: { applicantType, itemCount: requestedItems.length },
      });
    });

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
    revalidatePath("/admin/peralatan");
    return {
      ok: true,
      message: whatsappUrl
        ? "Permohonan disimpan. Hantar WhatsApp kepada pegawai PKG untuk tindakan."
        : "Permohonan disimpan. Nombor WhatsApp pegawai PKG belum ditetapkan.",
      referenceNo,
      whatsappUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
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
