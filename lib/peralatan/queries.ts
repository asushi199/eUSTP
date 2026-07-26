import "server-only";

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  equipmentLoanAllocations,
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
    .orderBy(asc(schools.name));
}

export async function listEquipmentCatalog(
  includeInactive = false,
): Promise<EquipmentCatalogItem[]> {
  const [typeRows, unitRows, pkgRows] = await Promise.all([
    db
      .select()
      .from(equipmentTypes)
      .where(includeInactive ? undefined : eq(equipmentTypes.active, true))
      .orderBy(asc(equipmentTypes.sortOrder), asc(equipmentTypes.name)),
    db
      .select({
        equipmentTypeId: equipmentUnits.equipmentTypeId,
        pkgId: equipmentUnits.pkgId,
        status: equipmentUnits.status,
      })
      .from(equipmentUnits),
    db.select({ id: pkgs.id }).from(pkgs).where(eq(pkgs.active, true)),
  ]);

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
  const [availableRows, allocatedRows] = await Promise.all([
    typeIds.length
      ? db
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
      : [],
    itemIds.length
      ? db
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
      : [],
  ]);

  return {
    ...request,
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
  };
}
