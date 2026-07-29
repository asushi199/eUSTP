"use server";

import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  driveViewUrl,
  isGasStorageConfigured,
  uploadFileViaGas,
} from "@/lib/gas-upload";
import {
  buildKewPa9Data,
  generateKewPa9Pdf,
} from "@/lib/peralatan/kew-pa9";
import { getEquipmentLoanDetail } from "@/lib/peralatan/queries";
import type { EquipmentDocumentStage } from "@/lib/peralatan/types";
import { requireTempahanAccess } from "@/lib/rbac";
import {
  equipmentCategories,
  equipmentLoanAllocations,
  equipmentLoanDocuments,
  equipmentLoanEvents,
  equipmentLoanItems,
  equipmentLoanRequests,
  equipmentTypes,
  equipmentUnitTransfers,
  equipmentUnits,
  pkgs,
} from "@/lib/schema";
import { normalizePhoneNumber } from "@/lib/tempahan/booking-rules";

export type EquipmentAdminActionResult = {
  ok: boolean;
  error?: string;
  imported?: number;
  transferred?: number;
  publicUrl?: string;
};

const unitStatuses = [
  "available",
  "maintenance",
  "retired",
  "lost",
] as const;

function text(formData: FormData, key: string, max = 500): string {
  return String(formData.get(key) ?? "")
    .trim()
    .slice(0, max);
}

function lines(formData: FormData, key: string, max = 100): string[] {
  return text(formData, key, 5000)
    .split(/\r?\n/)
    .map((value) => value.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean)
    .slice(0, max);
}

function refreshEquipmentPaths(pkgId: string, requestId?: string) {
  revalidatePath("/tempahan/peralatan");
  revalidatePath("/admin/peralatan");
  revalidatePath(`/admin/peralatan/${pkgId}`);
  revalidatePath(`/admin/peralatan/${pkgId}/unit`);
  revalidatePath(`/admin/peralatan/${pkgId}/unit/senarai`);
  revalidatePath(`/admin/peralatan/${pkgId}/permohonan`);
  if (requestId) {
    revalidatePath(`/admin/peralatan/${pkgId}/permohonan/${requestId}`);
  }
}

export async function saveEquipmentType(
  pkgId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);
  if (user.peranan === "PKG_Admin") {
    return { ok: false, error: "Anda tidak dibenarkan menambah jenis aset." };
  }
  const categoryId = text(formData, "categoryId", 80);
  const code = text(formData, "code", 20).toUpperCase();
  const name = text(formData, "name", 200);
  const model = text(formData, "model", 300);
  const description = text(formData, "description", 1000);
  const specifications = lines(formData, "specifications");
  const components = lines(formData, "components");
  const searchAliases = text(formData, "searchAliases", 1000)
    .split(/[\n,]/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (
    !z.string().uuid().safeParse(categoryId).success ||
    !code ||
    !name
  ) {
    return { ok: false, error: "Kategori, kod dan nama peralatan diperlukan." };
  }
  try {
    await db.insert(equipmentTypes).values({
      categoryId,
      code,
      name,
      model,
      description,
      specifications,
      components,
      searchAliases: Array.from(new Set(searchAliases)).slice(0, 30),
    });
    refreshEquipmentPaths(pkgId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: message.includes("equipment_types_code_idx")
        ? "Kod peralatan ini sudah digunakan."
        : "Peralatan tidak dapat disimpan.",
    };
  }
}

export async function saveEquipmentCategory(
  pkgId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);
  if (user.peranan === "PKG_Admin") {
    return { ok: false, error: "Anda tidak dibenarkan mengubah kategori aset." };
  }
  const categoryId = text(formData, "categoryId", 80);
  const code = text(formData, "code", 30).toUpperCase();
  const name = text(formData, "name", 200);
  const description = text(formData, "description", 1000);
  const searchAliases = text(formData, "searchAliases", 1000)
    .split(/[\n,]/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const active = formData.get("active") !== "no";
  if (!code || !name) {
    return { ok: false, error: "Kod dan nama kategori diperlukan." };
  }

  try {
    if (categoryId) {
      if (!z.string().uuid().safeParse(categoryId).success) {
        return { ok: false, error: "Kategori tidak sah." };
      }
      await db
        .update(equipmentCategories)
        .set({
          code,
          name,
          description,
          searchAliases: Array.from(new Set(searchAliases)).slice(0, 30),
          active,
          updatedAt: new Date(),
        })
        .where(eq(equipmentCategories.id, categoryId));
    } else {
      await db.insert(equipmentCategories).values({
        code,
        name,
        description,
        searchAliases: Array.from(new Set(searchAliases)).slice(0, 30),
      });
    }
    refreshEquipmentPaths(pkgId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Kategori tidak dapat disimpan. Semak kod kategori." };
  }
}

export async function updateEquipmentType(
  pkgId: string,
  typeId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);
  if (user.peranan === "PKG_Admin") {
    return { ok: false, error: "Anda tidak dibenarkan mengubah maklumat aset." };
  }
  if (!z.string().uuid().safeParse(typeId).success) {
    return { ok: false, error: "Jenis aset tidak sah." };
  }
  const categoryId = text(formData, "categoryId", 80);
  const code = text(formData, "code", 30).toUpperCase();
  const name = text(formData, "name", 200);
  const model = text(formData, "model", 300);
  const description = text(formData, "description", 1000);
  const specifications = lines(formData, "specifications");
  const components = lines(formData, "components");
  const searchAliases = text(formData, "searchAliases", 1000)
    .split(/[\n,]/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const active = formData.get("active") !== "no";
  if (
    !z.string().uuid().safeParse(categoryId).success ||
    !code ||
    !name
  ) {
    return { ok: false, error: "Kategori, kod dan nama aset diperlukan." };
  }
  try {
    await db
      .update(equipmentTypes)
      .set({
        categoryId,
        code,
        name,
        model,
        description,
        specifications,
        components,
        searchAliases: Array.from(new Set(searchAliases)).slice(0, 30),
        active,
        updatedAt: new Date(),
      })
      .where(eq(equipmentTypes.id, typeId));
    refreshEquipmentPaths(pkgId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Maklumat aset tidak dapat dikemas kini." };
  }
}

export async function addEquipmentUnit(
  pkgId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  await requireTempahanAccess(pkgId);
  const equipmentTypeId = text(formData, "equipmentTypeId", 80);
  const serialNo = text(formData, "serialNo", 200);
  const governmentAssetNo = text(formData, "governmentAssetNo", 200);
  const notes = text(formData, "notes", 500);
  if (!z.string().uuid().safeParse(equipmentTypeId).success || !serialNo) {
    return { ok: false, error: "Jenis dan nombor siri peralatan diperlukan." };
  }

  const type = await db.query.equipmentTypes.findFirst({
    where: eq(equipmentTypes.id, equipmentTypeId),
  });
  if (!type) return { ok: false, error: "Jenis peralatan tidak dijumpai." };

  try {
    await db.insert(equipmentUnits).values({
      equipmentTypeId,
      pkgId,
      serialNo,
      governmentAssetNo: governmentAssetNo || null,
      notes,
    });
    refreshEquipmentPaths(pkgId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Nombor siri atau nombor aset ini sudah digunakan." };
  }
}

function normalizedRow(row: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.trim().toLowerCase().replace(/[\s-]+/g, "_"),
      String(value ?? "").trim(),
    ]),
  );
}

function firstValue(row: Record<string, string>, keys: string[]) {
  return keys.map((key) => row[key]).find(Boolean) ?? "";
}

export async function importEquipmentUnits(
  pkgId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  await requireTempahanAccess(pkgId);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pilih fail Excel atau CSV." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Fail import melebihi 5 MB." };
  }

  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return { ok: false, error: "Fail tidak mempunyai lembaran data." };
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
    if (rawRows.length === 0) return { ok: false, error: "Fail import kosong." };
    if (rawRows.length > 1000) {
      return { ok: false, error: "Maksimum 1,000 unit bagi setiap import." };
    }

    const typeRows = await db
      .select({ id: equipmentTypes.id, code: equipmentTypes.code })
      .from(equipmentTypes);
    const typeByCode = new Map(typeRows.map((type) => [type.code.toUpperCase(), type.id]));
    const parsed = rawRows.map(normalizedRow).map((row, index) => {
      const typeCode = firstValue(row, [
        "kod_peralatan",
        "type_code",
        "code",
        "kod",
      ]).toUpperCase();
      const serialNo = firstValue(row, [
        "no_siri_peralatan",
        "nombor_siri",
        "serial_no",
        "serial",
      ]);
      const governmentAssetNo = firstValue(row, [
        "no_siri_aset_kerajaan",
        "nombor_aset",
        "government_asset_no",
        "asset_no",
      ]);
      const notes = firstValue(row, ["catatan", "notes"]);
      const equipmentTypeId = typeByCode.get(typeCode);
      if (!equipmentTypeId || !serialNo) {
        throw new Error(
          `Baris ${index + 2}: kod peralatan atau nombor siri tidak sah.`,
        );
      }
      return {
        equipmentTypeId,
        pkgId,
        serialNo,
        governmentAssetNo: governmentAssetNo || null,
        notes,
      };
    });

    const duplicateKeys = new Set<string>();
    for (const row of parsed) {
      const key = `${row.equipmentTypeId}:${row.serialNo.toLowerCase()}`;
      if (duplicateKeys.has(key)) {
        return { ok: false, error: `Nombor siri berulang dalam fail: ${row.serialNo}` };
      }
      duplicateKeys.add(key);
    }

    await db.insert(equipmentUnits).values(parsed);
    refreshEquipmentPaths(pkgId);
    return { ok: true, imported: parsed.length };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.message.startsWith("Baris ")
          ? error.message
          : "Import gagal. Semak tajuk lajur dan nombor siri berulang.",
    };
  }
}

export async function updateEquipmentUnitStatus(
  pkgId: string,
  unitId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  await requireTempahanAccess(pkgId);
  const status = text(formData, "status", 30);
  if (!unitStatuses.includes(status as (typeof unitStatuses)[number])) {
    return { ok: false, error: "Status tidak sah." };
  }
  const unit = await db.query.equipmentUnits.findFirst({
    where: and(eq(equipmentUnits.id, unitId), eq(equipmentUnits.pkgId, pkgId)),
  });
  if (!unit) return { ok: false, error: "Unit tidak dijumpai." };
  if (unit.status === "reserved" || unit.status === "borrowed") {
    return {
      ok: false,
      error: "Unit yang ditempah atau dipinjam mesti dikemas kini melalui aliran pinjaman.",
    };
  }
  await db
    .update(equipmentUnits)
    .set({ status: status as (typeof unitStatuses)[number], updatedAt: new Date() })
    .where(and(eq(equipmentUnits.id, unitId), eq(equipmentUnits.pkgId, pkgId)));
  refreshEquipmentPaths(pkgId);
  return { ok: true };
}

export async function transferEquipmentUnits(
  pkgId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);
  if (user.peranan === "PKG_Admin") {
    return {
      ok: false,
      error: "Pemindahan antara PKG hanya boleh dilakukan oleh pentadbir utama.",
    };
  }

  const destinationPkgId = text(formData, "destinationPkgId", 80);
  const notes = text(formData, "notes", 500);
  const unitIds = Array.from(
    new Set(
      formData
        .getAll("unitIds")
        .map((value) => String(value))
        .filter((value) => z.string().uuid().safeParse(value).success),
    ),
  ).slice(0, 100);

  if (!destinationPkgId || destinationPkgId === pkgId) {
    return { ok: false, error: "Pilih PKG baharu yang sah." };
  }
  if (unitIds.length === 0) {
    return { ok: false, error: "Pilih sekurang-kurangnya satu unit tersedia." };
  }

  const destination = await db.query.pkgs.findFirst({
    where: and(eq(pkgs.id, destinationPkgId), eq(pkgs.active, true)),
    columns: { id: true },
  });
  if (!destination) return { ok: false, error: "PKG baharu tidak dijumpai." };

  try {
    await db.transaction(async (tx) => {
      const transferable = await tx
        .select({ id: equipmentUnits.id })
        .from(equipmentUnits)
        .where(
          and(
            eq(equipmentUnits.pkgId, pkgId),
            eq(equipmentUnits.status, "available"),
            inArray(equipmentUnits.id, unitIds),
          ),
        );
      if (transferable.length !== unitIds.length) {
        throw new Error("UNIT_NOT_AVAILABLE");
      }

      await tx.insert(equipmentUnitTransfers).values(
        transferable.map((unit) => ({
          unitId: unit.id,
          fromPkgId: pkgId,
          toPkgId: destinationPkgId,
          movedByUserId: Number(user.id) || null,
          notes,
        })),
      );
      await tx
        .update(equipmentUnits)
        .set({ pkgId: destinationPkgId, updatedAt: new Date() })
        .where(
          and(
            eq(equipmentUnits.pkgId, pkgId),
            eq(equipmentUnits.status, "available"),
            inArray(equipmentUnits.id, unitIds),
          ),
        );
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.message === "UNIT_NOT_AVAILABLE"
          ? "Sebahagian unit tidak lagi tersedia. Segarkan halaman dan pilih semula."
          : "Unit tidak dapat dipindahkan.",
    };
  }

  refreshEquipmentPaths(pkgId);
  refreshEquipmentPaths(destinationPkgId);
  return { ok: true, transferred: unitIds.length };
}

export async function updateEquipmentManager(
  pkgId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  await requireTempahanAccess(pkgId);
  const name = text(formData, "name", 200);
  const position = text(formData, "position", 300);
  const rawPhone = text(formData, "phone", 30);
  const phone = normalizePhoneNumber(rawPhone);
  if (!name || !position || !phone) {
    return { ok: false, error: "Nama, jawatan dan nombor telefon diperlukan." };
  }
  await db
    .update(pkgs)
    .set({
      equipmentManagerName: name,
      equipmentManagerPosition: position,
      equipmentManagerPhone: phone,
    })
    .where(eq(pkgs.id, pkgId));
  refreshEquipmentPaths(pkgId);
  return { ok: true };
}

const allocationsSchema = z.array(
  z.object({
    requestItemId: z.string().uuid(),
    unitIds: z.array(z.string().uuid()).min(1).max(120),
  }),
);

export async function approveEquipmentLoan(
  pkgId: string,
  requestId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);
  const decisionNote = text(formData, "decisionNote", 1000);
  let allocations: z.infer<typeof allocationsSchema>;
  try {
    allocations = allocationsSchema.parse(
      JSON.parse(text(formData, "allocations", 50_000)),
    );
  } catch {
    return { ok: false, error: "Lengkapkan semua peruntukan nombor siri." };
  }

  try {
    await db.transaction(async (tx) => {
      const request = await tx.query.equipmentLoanRequests.findFirst({
        where: and(
          eq(equipmentLoanRequests.id, requestId),
          eq(equipmentLoanRequests.pkgId, pkgId),
        ),
      });
      if (!request || request.status !== "pending") {
        throw new Error("Permohonan ini tidak lagi menunggu kelulusan.");
      }

      const items = await tx
        .select()
        .from(equipmentLoanItems)
        .where(eq(equipmentLoanItems.requestId, requestId));
      const allocationByItem = new Map(
        allocations.map((allocation) => [allocation.requestItemId, allocation.unitIds]),
      );
      const allUnitIds = allocations.flatMap((allocation) => allocation.unitIds);
      if (new Set(allUnitIds).size !== allUnitIds.length) {
        throw new Error("Nombor siri yang sama dipilih lebih daripada sekali.");
      }
      if (
        items.length !== allocations.length ||
        items.some(
          (item) => allocationByItem.get(item.id)?.length !== item.quantity,
        )
      ) {
        throw new Error("Bilangan unit yang diperuntukkan tidak mencukupi.");
      }

      const unitRows = await tx
        .select({
          id: equipmentUnits.id,
          categoryId: equipmentTypes.categoryId,
        })
        .from(equipmentUnits)
        .innerJoin(
          equipmentTypes,
          eq(equipmentUnits.equipmentTypeId, equipmentTypes.id),
        )
        .where(
          and(
            eq(equipmentUnits.pkgId, pkgId),
            eq(equipmentUnits.status, "available"),
            inArray(equipmentUnits.id, allUnitIds),
          ),
        );
      if (unitRows.length !== allUnitIds.length) {
        throw new Error("Satu atau lebih unit tidak lagi tersedia.");
      }
      for (const item of items) {
        const selected = allocationByItem.get(item.id) ?? [];
        const valid = selected.every(
          (unitId) =>
            unitRows.find((unit) => unit.id === unitId)?.categoryId ===
            item.categoryId,
        );
        if (!valid) throw new Error("Jenis unit yang dipilih tidak sepadan.");
      }

      for (const unitId of allUnitIds) {
        const updated = await tx
          .update(equipmentUnits)
          .set({ status: "reserved", updatedAt: new Date() })
          .where(
            and(
              eq(equipmentUnits.id, unitId),
              eq(equipmentUnits.status, "available"),
            ),
          )
          .returning({ id: equipmentUnits.id });
        if (updated.length !== 1) {
          throw new Error("Stok berubah semasa kelulusan. Muat semula halaman.");
        }
      }

      await tx.insert(equipmentLoanAllocations).values(
        allocations.flatMap((allocation) =>
          allocation.unitIds.map((unitId) => ({
            requestItemId: allocation.requestItemId,
            unitId,
            allocatedByUserId: Number(user.id),
          })),
        ),
      );
      await tx
        .update(equipmentLoanRequests)
        .set({
          status: "approved",
          decisionNote,
          approvedByUserId: Number(user.id),
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(equipmentLoanRequests.id, requestId));
      await tx.insert(equipmentLoanEvents).values({
        requestId,
        action: "application_approved",
        actorUserId: Number(user.id),
        details: { allocatedUnitIds: allUnitIds, decisionNote },
      });
    });
    refreshEquipmentPaths(pkgId, requestId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Kelulusan gagal.",
    };
  }
}

export async function rejectEquipmentLoan(
  pkgId: string,
  requestId: string,
  formData: FormData,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);
  const decisionNote = text(formData, "decisionNote", 1000);
  const updated = await db
    .update(equipmentLoanRequests)
    .set({
      status: "rejected",
      decisionNote,
      rejectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(equipmentLoanRequests.id, requestId),
        eq(equipmentLoanRequests.pkgId, pkgId),
        eq(equipmentLoanRequests.status, "pending"),
      ),
    )
    .returning({ id: equipmentLoanRequests.id });
  if (updated.length !== 1) {
    return { ok: false, error: "Permohonan ini tidak lagi menunggu tindakan." };
  }
  await db.insert(equipmentLoanEvents).values({
    requestId,
    action: "application_rejected",
    actorUserId: Number(user.id),
    details: { decisionNote },
  });
  refreshEquipmentPaths(pkgId, requestId);
  return { ok: true };
}

async function allocatedUnitsForRequest(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  requestId: string,
) {
  return tx
    .select({
      allocationId: equipmentLoanAllocations.id,
      unitId: equipmentLoanAllocations.unitId,
    })
    .from(equipmentLoanAllocations)
    .innerJoin(
      equipmentLoanItems,
      eq(equipmentLoanAllocations.requestItemId, equipmentLoanItems.id),
    )
    .where(eq(equipmentLoanItems.requestId, requestId));
}

export async function recordEquipmentHandover(
  pkgId: string,
  requestId: string,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);

  try {
    await db.transaction(async (tx) => {
      const request = await tx.query.equipmentLoanRequests.findFirst({
        where: and(
          eq(equipmentLoanRequests.id, requestId),
          eq(equipmentLoanRequests.pkgId, pkgId),
        ),
      });
      if (!request || request.status !== "approved") {
        throw new Error("Permohonan ini tidak lagi menunggu serahan.");
      }
      if (!request.declarationAcceptedAt || !request.applicantMykadLast4) {
        throw new Error(
          "Akuan pemohon atau maklumat MyKad belum lengkap. Permohonan lama perlu disahkan secara manual.",
        );
      }

      const allocations = await allocatedUnitsForRequest(tx, requestId);
      if (allocations.length === 0) {
        throw new Error("Tiada unit diperuntukkan untuk permohonan ini.");
      }
      const unitIds = allocations.map((allocation) => allocation.unitId);
      const updatedUnits = await tx
        .update(equipmentUnits)
        .set({ status: "borrowed", updatedAt: new Date() })
        .where(
          and(
            inArray(equipmentUnits.id, unitIds),
            eq(equipmentUnits.pkgId, pkgId),
            eq(equipmentUnits.status, "reserved"),
          ),
        )
        .returning({ id: equipmentUnits.id });
      if (updatedUnits.length !== unitIds.length) {
        throw new Error(
          "Status unit telah berubah. Muat semula halaman sebelum serahan.",
        );
      }

      const handedOverAt = new Date();
      await tx
        .update(equipmentLoanRequests)
        .set({
          status: "handed_over",
          handedOverAt,
          updatedAt: handedOverAt,
        })
        .where(eq(equipmentLoanRequests.id, requestId));
      await tx.insert(equipmentLoanEvents).values({
        requestId,
        action: "equipment_handed_over",
        actorUserId: Number(user.id),
        details: {
          unitIds,
          declarationVersion: request.declarationVersion,
          identityChecked: true,
          paperSignaturesRequiredAtReturn: true,
        },
      });
    });
    refreshEquipmentPaths(pkgId, requestId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Serahan tidak berjaya.",
    };
  }
}

export async function recordEquipmentReturn(
  pkgId: string,
  requestId: string,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);

  try {
    await db.transaction(async (tx) => {
      const request = await tx.query.equipmentLoanRequests.findFirst({
        where: and(
          eq(equipmentLoanRequests.id, requestId),
          eq(equipmentLoanRequests.pkgId, pkgId),
        ),
      });
      if (!request || request.status !== "handed_over") {
        throw new Error("Permohonan ini tidak lagi menunggu pemulangan.");
      }

      const allocations = await allocatedUnitsForRequest(tx, requestId);
      const unitIds = allocations.map((allocation) => allocation.unitId);
      if (unitIds.length === 0) {
        throw new Error("Tiada unit pinjaman dijumpai.");
      }
      const returnedAt = new Date();
      const updatedUnits = await tx
        .update(equipmentUnits)
        .set({ status: "available", updatedAt: returnedAt })
        .where(
          and(
            inArray(equipmentUnits.id, unitIds),
            eq(equipmentUnits.pkgId, pkgId),
            eq(equipmentUnits.status, "borrowed"),
          ),
        )
        .returning({ id: equipmentUnits.id });
      if (updatedUnits.length !== unitIds.length) {
        throw new Error(
          "Status unit telah berubah. Muat semula halaman sebelum menerima.",
        );
      }

      await tx
        .update(equipmentLoanAllocations)
        .set({ releasedAt: returnedAt })
        .where(
          inArray(
            equipmentLoanAllocations.id,
            allocations.map((allocation) => allocation.allocationId),
          ),
        );
      await tx
        .update(equipmentLoanRequests)
        .set({
          status: "returned",
          returnedAt,
          updatedAt: returnedAt,
        })
        .where(eq(equipmentLoanRequests.id, requestId));
      await tx.insert(equipmentLoanEvents).values({
        requestId,
        action: "equipment_returned",
        actorUserId: Number(user.id),
        details: {
          unitIds,
          conditionChecked: true,
          paperSignaturesRequired: true,
        },
      });
    });
    refreshEquipmentPaths(pkgId, requestId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Pemulangan tidak berjaya.",
    };
  }
}

function documentFileName(referenceNo: string, stage: EquipmentDocumentStage) {
  const safeReference = referenceNo.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `KEW.PA-9-${safeReference}-${
    stage === "final" ? "untuk-tandatangan" : "serahan"
  }.pdf`;
}

export async function generateAndStoreEquipmentKewPa9(
  pkgId: string,
  requestId: string,
  stage: EquipmentDocumentStage,
): Promise<EquipmentAdminActionResult> {
  const user = await requireTempahanAccess(pkgId);
  if (stage !== "final") {
    return {
      ok: false,
      error: "KEW.PA-9 hanya dijana selepas pemulangan.",
    };
  }
  const request = await getEquipmentLoanDetail(pkgId, requestId);
  if (!request) return { ok: false, error: "Permohonan tidak dijumpai." };
  if (request.status !== "returned") {
    return {
      ok: false,
      error: "Lengkapkan pemulangan dahulu.",
    };
  }
  if (!isGasStorageConfigured()) {
    return {
      ok: false,
      error:
        "Google Drive belum dikonfigurasi. PDF masih boleh dimuat turun terus.",
    };
  }

  const fileName = documentFileName(request.referenceNo, stage);
  await db
    .insert(equipmentLoanDocuments)
    .values({
      requestId,
      stage,
      status: "generating",
      fileName,
      generatedByUserId: Number(user.id),
    })
    .onConflictDoUpdate({
      target: [
        equipmentLoanDocuments.requestId,
        equipmentLoanDocuments.stage,
      ],
      set: {
        status: "generating",
        fileName,
        errorMessage: "",
        generatedByUserId: Number(user.id),
        updatedAt: new Date(),
      },
    });

  try {
    const buffer = await generateKewPa9Pdf(buildKewPa9Data(request), stage);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const uploaded = await uploadFileViaGas(
      { name: fileName, type: "application/pdf", buffer },
      {
        fileName,
        subPath: [
          "Pinjaman Peralatan",
          pkgId,
          String(new Date().getFullYear()),
        ],
      },
    );
    const publicUrl = driveViewUrl(uploaded.path) ?? uploaded.publicUrl;
    await db
      .update(equipmentLoanDocuments)
      .set({
        status: "ready",
        storagePath: uploaded.path,
        publicUrl,
        sha256,
        errorMessage: "",
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(equipmentLoanDocuments.requestId, requestId),
          eq(equipmentLoanDocuments.stage, stage),
        ),
      );
    await db.insert(equipmentLoanEvents).values({
      requestId,
      action: "kew_pa9_generated",
      actorUserId: Number(user.id),
      details: { stage, fileName, sha256, storagePath: uploaded.path },
    });
    refreshEquipmentPaths(pkgId, requestId);
    return { ok: true, publicUrl };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF tidak dapat disimpan.";
    await db
      .update(equipmentLoanDocuments)
      .set({
        status: "failed",
        errorMessage: message.slice(0, 1000),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(equipmentLoanDocuments.requestId, requestId),
          eq(equipmentLoanDocuments.stage, stage),
        ),
      );
    refreshEquipmentPaths(pkgId, requestId);
    return {
      ok: false,
      error: `${message} Tandatangan dan status pinjaman telah disimpan dengan selamat.`,
    };
  }
}
