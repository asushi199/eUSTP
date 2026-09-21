import "server-only";

import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  equipmentCategories,
  equipmentLoanAllocations,
  equipmentLoanItems,
  equipmentLoanRequests,
  pkgs,
} from "@/lib/schema";
import { fillMonths } from "./year";
import type { BreakdownPoint, MonthPoint, StatKpi } from "./types";

/** Permohonan yang telah diluluskan (masih aktif, diserahkan, atau dipulangkan). */
const DILULUSKAN = ["approved", "handed_over", "returned"] as const;

function tsYear(
  column:
    | typeof equipmentLoanRequests.approvedAt
    | typeof equipmentLoanRequests.handedOverAt
    | typeof equipmentLoanRequests.returnedAt,
  year: number,
) {
  return and(
    gte(column, new Date(`${year}-01-01T00:00:00+08:00`)),
    lt(column, new Date(`${year + 1}-01-01T00:00:00+08:00`)),
  );
}

export type PinjamanAnalisis = {
  kpi: StatKpi[];
  byPkg: BreakdownPoint[];
  byJenis: BreakdownPoint[];
  monthly: MonthPoint[];
};

export function emptyPinjamanAnalisis(): PinjamanAnalisis {
  return {
    kpi: [
      { label: "Permohonan diluluskan", value: 0 },
      { label: "Unit diserahkan", value: 0 },
      { label: "Sudah dipulangkan", value: 0 },
    ],
    byPkg: [],
    byJenis: [],
    monthly: fillMonths(new Map()),
  };
}

export async function getPinjamanKpi(year: number): Promise<StatKpi[]> {
  const diluluskanWhere = and(
    inArray(equipmentLoanRequests.status, [...DILULUSKAN]),
    tsYear(equipmentLoanRequests.approvedAt, year),
  );
  const [kpiDiluluskan] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(equipmentLoanRequests)
    .where(diluluskanWhere);
  return [{ label: "Permohonan diluluskan", value: kpiDiluluskan?.n ?? 0 }];
}

export async function getPinjamanAnalisis(year: number): Promise<PinjamanAnalisis> {
  const diluluskanWhere = and(
    inArray(equipmentLoanRequests.status, [...DILULUSKAN]),
    tsYear(equipmentLoanRequests.approvedAt, year),
  );

  const headline = await getPinjamanKpi(year);
  const [kpiUnit] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(equipmentLoanAllocations)
    .innerJoin(
      equipmentLoanItems,
      eq(equipmentLoanAllocations.requestItemId, equipmentLoanItems.id),
    )
    .innerJoin(
      equipmentLoanRequests,
      eq(equipmentLoanItems.requestId, equipmentLoanRequests.id),
    )
    .where(
      and(
        inArray(equipmentLoanRequests.status, ["handed_over", "returned"]),
        tsYear(equipmentLoanRequests.handedOverAt, year),
      ),
    );
  const [kpiPulang] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(equipmentLoanRequests)
    .where(
      and(
        eq(equipmentLoanRequests.status, "returned"),
        tsYear(equipmentLoanRequests.returnedAt, year),
      ),
    );
  const kpi: StatKpi[] = [
    headline[0] ?? { label: "Permohonan diluluskan", value: 0 },
    { label: "Unit diserahkan", value: kpiUnit?.n ?? 0 },
    { label: "Sudah dipulangkan", value: kpiPulang?.n ?? 0 },
  ];
  const pkgRows = await db
    .select({
      pkgId: equipmentLoanRequests.pkgId,
      jumlah: sql<number>`count(*)::int`,
    })
    .from(equipmentLoanRequests)
    .where(diluluskanWhere)
    .groupBy(equipmentLoanRequests.pkgId);
  const jenisRows = await db
    .select({
      name: equipmentCategories.name,
      jumlah: sql<number>`coalesce(sum(${equipmentLoanItems.quantity}), 0)::int`,
    })
    .from(equipmentLoanItems)
    .innerJoin(
      equipmentLoanRequests,
      eq(equipmentLoanItems.requestId, equipmentLoanRequests.id),
    )
    .innerJoin(
      equipmentCategories,
      eq(equipmentLoanItems.categoryId, equipmentCategories.id),
    )
    .where(diluluskanWhere)
    .groupBy(equipmentCategories.id, equipmentCategories.name)
    .orderBy(sql`sum(${equipmentLoanItems.quantity}) desc`)
    .limit(8);
  const monthRows = await db
    .select({
      bulan: sql<number>`extract(month from timezone('Asia/Kuala_Lumpur', ${equipmentLoanRequests.approvedAt}))::int`,
    })
    .from(equipmentLoanRequests)
    .where(diluluskanWhere);
  const pkgNames = await db
    .select({ id: pkgs.id, name: pkgs.name })
    .from(pkgs)
    .orderBy(pkgs.name);

  const pkgCount = new Map(pkgRows.map((r) => [r.pkgId, r.jumlah]));
  const monthMap = new Map<number, number>();
  for (const row of monthRows) {
    if (row.bulan == null) continue;
    monthMap.set(row.bulan, (monthMap.get(row.bulan) ?? 0) + 1);
  }

  return {
    kpi,
    byPkg: pkgNames.map((pkg) => ({
      label: pkg.name,
      jumlah: pkgCount.get(pkg.id) ?? 0,
    })),
    byJenis: jenisRows
      .filter((r) => r.jumlah > 0)
      .map((r) => ({ label: r.name, jumlah: r.jumlah })),
    monthly: fillMonths(monthMap),
  };
}

export async function minPinjamanYear(): Promise<number | null> {
  const [row] = await db
    .select({
      min: sql<number | null>`min(extract(year from timezone('Asia/Kuala_Lumpur', ${equipmentLoanRequests.approvedAt})))::int`,
    })
    .from(equipmentLoanRequests)
    .where(inArray(equipmentLoanRequests.status, [...DILULUSKAN]));
  return row?.min ?? null;
}
