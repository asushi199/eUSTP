import "server-only";

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  equipmentLoanAllocations,
  equipmentLoanDocuments,
  equipmentLoanItems,
  equipmentLoanRequests,
  equipmentTypes,
  equipmentUnits,
  pkgs,
  schools,
} from "@/lib/schema";
import type {
  EquipmentCatalogItem,
  EquipmentLoanDetail,
  EquipmentLoanListItem,
  EquipmentLoanPublicResult,
  EquipmentPkg,
  EquipmentSchool,
  EquipmentUnitListItem,
} from "./types";

export async function listEquipmentPkgs(): Promise<EquipmentPkg[]> {
  const rows = await db
    .select({
      id: pkgs.id,
      name: pkgs.name,
      managerName: pkgs.equipmentManagerName,
      managerPosition: pkgs.equipmentManagerPosition,
      managerPhone: pkgs.equipmentManagerPhone,
      fallbackPhone: pkgs.whatsappAdminPhone,
    })
    .from(pkgs)
    .where(eq(pkgs.active, true))
    .orderBy(asc(pkgs.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    managerName: row.managerName ?? "",
    managerPosition: row.managerPosition ?? "",
    managerPhone: row.managerPhone ?? row.fallbackPhone ?? "",
  }));
}

export async function listEquipmentSchools(): Promise<EquipmentSchool[]> {
  return db
    .select({ code: schools.code, name: schools.name })
    .from(schools)
    .orderBy(asc(schools.code));
}

export async function listEquipmentCatalog(
  includeInactive = false,
): Promise<EquipmentCatalogItem[]> {
  // Sequential queries: serverless pooler only has ~3 connections per
  // instance. Concurrent Promise.all here has hung /mohon for a full 5m.
  const typeRows = await db
    .select()
    .from(equipmentTypes)
    .where(includeInactive ? undefined : eq(equipmentTypes.active, true))
    .orderBy(asc(equipmentTypes.sortOrder), asc(equipmentTypes.name));
  const unitRows = await db
    .select({
      equipmentTypeId: equipmentUnits.equipmentTypeId,
      pkgId: equipmentUnits.pkgId,
      status: equipmentUnits.status,
    })
    .from(equipmentUnits);
  const pkgRows = await db
    .select({ id: pkgs.id })
    .from(pkgs)
    .where(eq(pkgs.active, true));

  const validPkgIds = new Set(pkgRows.map((pkg) => pkg.id));
  return typeRows.map((type) => {
    const byPkg = new Map<string, { total: number; available: number }>();
    for (const unit of unitRows) {
      if (unit.equipmentTypeId !== type.id || !validPkgIds.has(unit.pkgId)) continue;
      const current = byPkg.get(unit.pkgId) ?? { total: 0, available: 0 };
      current.total += unit.status === "retired" || unit.status === "lost" ? 0 : 1;
      current.available += unit.status === "available" ? 1 : 0;
      byPkg.set(unit.pkgId, current);
    }
    return {
      id: type.id,
      code: type.code,
      name: type.name,
      model: type.model,
      description: type.description,
      searchAliases: type.searchAliases,
      components: type.components,
      stocks: Array.from(byPkg, ([pkgId, stock]) => ({ pkgId, ...stock })).filter(
        (stock) => stock.total > 0,
      ),
    };
  });
}

export async function listEquipmentUnitsForPkg(
  pkgId: string,
): Promise<EquipmentUnitListItem[]> {
  const rows = await db
    .select({
      id: equipmentUnits.id,
      equipmentTypeId: equipmentUnits.equipmentTypeId,
      typeCode: equipmentTypes.code,
      typeName: equipmentTypes.name,
      serialNo: equipmentUnits.serialNo,
      governmentAssetNo: equipmentUnits.governmentAssetNo,
      status: equipmentUnits.status,
      notes: equipmentUnits.notes,
    })
    .from(equipmentUnits)
    .innerJoin(equipmentTypes, eq(equipmentUnits.equipmentTypeId, equipmentTypes.id))
    .where(eq(equipmentUnits.pkgId, pkgId))
    .orderBy(asc(equipmentTypes.sortOrder), asc(equipmentUnits.serialNo));

  return rows.map((row) => ({
    ...row,
    governmentAssetNo: row.governmentAssetNo ?? "",
  }));
}

export async function listEquipmentLoansForPkg(
  pkgId: string,
): Promise<EquipmentLoanListItem[]> {
  const rows = await db
    .select({
      id: equipmentLoanRequests.id,
      referenceNo: equipmentLoanRequests.referenceNo,
      orgName: equipmentLoanRequests.orgName,
      applicantName: equipmentLoanRequests.applicantName,
      borrowDate: equipmentLoanRequests.borrowDate,
      expectedReturnDate: equipmentLoanRequests.expectedReturnDate,
      status: equipmentLoanRequests.status,
      createdAt: equipmentLoanRequests.createdAt,
      totalQuantity: sql<number>`coalesce(sum(${equipmentLoanItems.quantity}), 0)::int`,
    })
    .from(equipmentLoanRequests)
    .leftJoin(
      equipmentLoanItems,
      eq(equipmentLoanRequests.id, equipmentLoanItems.requestId),
    )
    .where(eq(equipmentLoanRequests.pkgId, pkgId))
    .groupBy(equipmentLoanRequests.id)
    .orderBy(desc(equipmentLoanRequests.createdAt));

  return rows;
}

export async function countPendingEquipmentLoansByPkg(
  pkgIds: string[],
): Promise<Record<string, number>> {
  if (pkgIds.length === 0) return {};
  const rows = await db
    .select({ pkgId: equipmentLoanRequests.pkgId, total: count() })
    .from(equipmentLoanRequests)
    .where(
      and(
        inArray(equipmentLoanRequests.pkgId, pkgIds),
        eq(equipmentLoanRequests.status, "pending"),
      ),
    )
    .groupBy(equipmentLoanRequests.pkgId);

  return Object.fromEntries(rows.map((row) => [row.pkgId, row.total]));
}

export async function listEquipmentLoansByContact(
  contactNormalized: string,
): Promise<EquipmentLoanPublicResult[]> {
  const requestRows = await db
    .select({
      id: equipmentLoanRequests.id,
      referenceNo: equipmentLoanRequests.referenceNo,
      pkgName: pkgs.name,
      orgName: equipmentLoanRequests.orgName,
      borrowDate: equipmentLoanRequests.borrowDate,
      expectedReturnDate: equipmentLoanRequests.expectedReturnDate,
      status: equipmentLoanRequests.status,
      decisionNote: equipmentLoanRequests.decisionNote,
      createdAt: equipmentLoanRequests.createdAt,
    })
    .from(equipmentLoanRequests)
    .innerJoin(pkgs, eq(equipmentLoanRequests.pkgId, pkgs.id))
    .where(eq(equipmentLoanRequests.contactNormalized, contactNormalized))
    .orderBy(desc(equipmentLoanRequests.createdAt))
    .limit(30);
  const requestIds = requestRows.map((request) => request.id);
  const itemRows = requestIds.length
    ? await db
        .select({
          requestId: equipmentLoanItems.requestId,
          name: equipmentTypes.name,
          quantity: equipmentLoanItems.quantity,
        })
        .from(equipmentLoanItems)
        .innerJoin(
          equipmentTypes,
          eq(equipmentLoanItems.equipmentTypeId, equipmentTypes.id),
        )
        .where(inArray(equipmentLoanItems.requestId, requestIds))
        .orderBy(asc(equipmentTypes.sortOrder))
    : [];

  return requestRows.map((request) => ({
    ...request,
    items: itemRows
      .filter((item) => item.requestId === request.id)
      .map(({ name, quantity }) => ({ name, quantity })),
  }));
}

export async function getEquipmentLoanDetail(
  pkgId: string,
  requestId: string,
): Promise<EquipmentLoanDetail | null> {
  const request = await db.query.equipmentLoanRequests.findFirst({
    where: and(
      eq(equipmentLoanRequests.id, requestId),
      eq(equipmentLoanRequests.pkgId, pkgId),
    ),
  });
  if (!request) return null;

  const itemRows = await db
    .select({
      id: equipmentLoanItems.id,
      equipmentTypeId: equipmentLoanItems.equipmentTypeId,
      typeCode: equipmentTypes.code,
      typeName: equipmentTypes.name,
      model: equipmentTypes.model,
      quantity: equipmentLoanItems.quantity,
    })
    .from(equipmentLoanItems)
    .innerJoin(equipmentTypes, eq(equipmentLoanItems.equipmentTypeId, equipmentTypes.id))
    .where(eq(equipmentLoanItems.requestId, requestId))
    .orderBy(asc(equipmentTypes.sortOrder));

  const itemIds = itemRows.map((item) => item.id);
  const typeIds = itemRows.map((item) => item.equipmentTypeId);
  const availableRows = typeIds.length
    ? await db
        .select({
          id: equipmentUnits.id,
          equipmentTypeId: equipmentUnits.equipmentTypeId,
          serialNo: equipmentUnits.serialNo,
          governmentAssetNo: equipmentUnits.governmentAssetNo,
        })
        .from(equipmentUnits)
        .where(
          and(
            eq(equipmentUnits.pkgId, pkgId),
            eq(equipmentUnits.status, "available"),
            inArray(equipmentUnits.equipmentTypeId, typeIds),
          ),
        )
        .orderBy(asc(equipmentUnits.serialNo))
    : [];
  const allocatedRows = itemIds.length
    ? await db
        .select({
          requestItemId: equipmentLoanAllocations.requestItemId,
          id: equipmentUnits.id,
          serialNo: equipmentUnits.serialNo,
          governmentAssetNo: equipmentUnits.governmentAssetNo,
        })
        .from(equipmentLoanAllocations)
        .innerJoin(
          equipmentUnits,
          eq(equipmentLoanAllocations.unitId, equipmentUnits.id),
        )
        .where(inArray(equipmentLoanAllocations.requestItemId, itemIds))
    : [];
  const documentRows = await db
    .select({
      stage: equipmentLoanDocuments.stage,
      status: equipmentLoanDocuments.status,
      fileName: equipmentLoanDocuments.fileName,
      storagePath: equipmentLoanDocuments.storagePath,
      publicUrl: equipmentLoanDocuments.publicUrl,
      sha256: equipmentLoanDocuments.sha256,
      errorMessage: equipmentLoanDocuments.errorMessage,
      generatedAt: equipmentLoanDocuments.generatedAt,
    })
    .from(equipmentLoanDocuments)
    .where(eq(equipmentLoanDocuments.requestId, requestId))
    .orderBy(asc(equipmentLoanDocuments.stage));

  const {
    applicantMykadEncrypted: _encryptedMykad,
    applicantMykadLast4,
    ...safeRequest
  } = request;
  return {
    ...safeRequest,
    applicantMykadMasked: applicantMykadLast4
      ? `******-**-${applicantMykadLast4}`
      : "Belum direkodkan",
    items: itemRows.map((item) => ({
      ...item,
      availableUnits: availableRows
        .filter((unit) => unit.equipmentTypeId === item.equipmentTypeId)
        .map((unit) => ({
          id: unit.id,
          serialNo: unit.serialNo,
          governmentAssetNo: unit.governmentAssetNo ?? "",
        })),
      allocatedUnits: allocatedRows
        .filter((unit) => unit.requestItemId === item.id)
        .map((unit) => ({
          id: unit.id,
          serialNo: unit.serialNo,
          governmentAssetNo: unit.governmentAssetNo ?? "",
      })),
    })),
    documents: documentRows,
  };
}
