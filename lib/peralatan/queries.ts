import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
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
  EquipmentLoanStatus,
  EquipmentLoanPublicResult,
  EquipmentPkg,
  EquipmentSchool,
  EquipmentUnitListItem,
  EquipmentUnitStatus,
} from "./types";

const ADMIN_PAGE_SIZE = 25;

export type EquipmentAdminListResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
};

export type EquipmentTypeOption = {
  id: string;
  code: string;
  name: string;
};

function normalizedPage(value: number | undefined) {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value ?? 1)) : 1;
}

function monthRange(month: string | undefined) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  if (monthNumber < 1 || monthNumber > 12) return null;
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  return {
    start: `${year.toString().padStart(4, "0")}-${monthNumber
      .toString()
      .padStart(2, "0")}-01`,
    end: `${nextYear.toString().padStart(4, "0")}-${nextMonth
      .toString()
      .padStart(2, "0")}-01`,
  };
}

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

export async function listEquipmentTypeOptions(): Promise<EquipmentTypeOption[]> {
  return db
    .select({
      id: equipmentTypes.id,
      code: equipmentTypes.code,
      name: equipmentTypes.name,
    })
    .from(equipmentTypes)
    .where(eq(equipmentTypes.active, true))
    .orderBy(asc(equipmentTypes.sortOrder), asc(equipmentTypes.name));
}

export async function listEquipmentUnitsForPkg(
  pkgId: string,
  filters: {
    search?: string;
    status?: EquipmentUnitStatus;
    equipmentTypeId?: string;
    page?: number;
    perPage?: number;
  } = {},
): Promise<EquipmentAdminListResult<EquipmentUnitListItem>> {
  const page = normalizedPage(filters.page);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? ADMIN_PAGE_SIZE));
  const search = filters.search?.trim().slice(0, 200) ?? "";
  const conditions = [eq(equipmentUnits.pkgId, pkgId)];
  if (filters.status) conditions.push(eq(equipmentUnits.status, filters.status));
  if (filters.equipmentTypeId) {
    conditions.push(eq(equipmentUnits.equipmentTypeId, filters.equipmentTypeId));
  }
  if (search) {
    const searchCondition = or(
      ilike(equipmentUnits.serialNo, `%${search}%`),
      ilike(equipmentUnits.governmentAssetNo, `%${search}%`),
      ilike(equipmentTypes.code, `%${search}%`),
      ilike(equipmentTypes.name, `%${search}%`),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  const where = and(...conditions);
  const totalRows = await db
    .select({ total: count() })
    .from(equipmentUnits)
    .innerJoin(equipmentTypes, eq(equipmentUnits.equipmentTypeId, equipmentTypes.id))
    .where(where);
  const total = totalRows[0]?.total ?? 0;
  const effectivePage = Math.min(page, Math.max(1, Math.ceil(total / perPage)));
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
    .where(where)
    .orderBy(asc(equipmentTypes.sortOrder), asc(equipmentUnits.serialNo))
    .limit(perPage)
    .offset((effectivePage - 1) * perPage);

  return {
    items: rows.map((row) => ({
      ...row,
      governmentAssetNo: row.governmentAssetNo ?? "",
    })),
    total,
    page: effectivePage,
    perPage,
  };
}

export async function listEquipmentLoansForPkg(
  pkgId: string,
  filters: {
    month?: string;
    status?: EquipmentLoanStatus;
    search?: string;
    page?: number;
    perPage?: number;
  } = {},
): Promise<EquipmentAdminListResult<EquipmentLoanListItem>> {
  const page = normalizedPage(filters.page);
  const perPage = Math.min(100, Math.max(1, filters.perPage ?? ADMIN_PAGE_SIZE));
  const search = filters.search?.trim().slice(0, 200) ?? "";
  const range = monthRange(filters.month);
  const conditions = [eq(equipmentLoanRequests.pkgId, pkgId)];
  if (filters.status) conditions.push(eq(equipmentLoanRequests.status, filters.status));
  if (range) {
    conditions.push(gte(equipmentLoanRequests.borrowDate, range.start));
    conditions.push(lt(equipmentLoanRequests.borrowDate, range.end));
  }
  if (search) {
    const searchCondition = or(
      ilike(equipmentLoanRequests.referenceNo, `%${search}%`),
      ilike(equipmentLoanRequests.applicantName, `%${search}%`),
      ilike(equipmentLoanRequests.orgName, `%${search}%`),
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  const where = and(...conditions);
  const totalRows = await db
    .select({ total: count() })
    .from(equipmentLoanRequests)
    .where(where);
  const total = totalRows[0]?.total ?? 0;
  const effectivePage = Math.min(page, Math.max(1, Math.ceil(total / perPage)));
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
    .where(where)
    .groupBy(equipmentLoanRequests.id)
    .orderBy(desc(equipmentLoanRequests.createdAt))
    .limit(perPage)
    .offset((effectivePage - 1) * perPage);

  return {
    items: rows,
    total,
    page: effectivePage,
    perPage,
  };
}

export async function getEquipmentAdminSummary(pkgId: string) {
  const unitRows = await db
    .select({ status: equipmentUnits.status, total: count() })
    .from(equipmentUnits)
    .where(eq(equipmentUnits.pkgId, pkgId))
    .groupBy(equipmentUnits.status);
  const pendingRows = await db
    .select({ total: count() })
    .from(equipmentLoanRequests)
    .where(
      and(
        eq(equipmentLoanRequests.pkgId, pkgId),
        eq(equipmentLoanRequests.status, "pending"),
      ),
    );
  const recent = await listEquipmentLoansForPkg(pkgId, {
    page: 1,
    perPage: 5,
  });
  const unitCounts = Object.fromEntries(
    unitRows.map((row) => [row.status, row.total]),
  ) as Partial<Record<EquipmentUnitStatus, number>>;

  return {
    pendingCount: pendingRows[0]?.total ?? 0,
    reservedCount: unitCounts.reserved ?? 0,
    borrowedCount: unitCounts.borrowed ?? 0,
    maintenanceCount: unitCounts.maintenance ?? 0,
    totalUnits: unitRows.reduce((sum, row) => sum + row.total, 0),
    recentLoans: recent.items,
  };
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
