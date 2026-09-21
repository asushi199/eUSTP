import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  equipmentCategories,
  equipmentLoanAllocations,
  equipmentLoanItems,
  equipmentLoanRequests,
  pkgs,
} from "@/lib/schema";
import { fillMonths, STATS_TZ } from "./year";
import type { BreakdownPoint, MonthPoint, StatKpi } from "./types";

/** Permohonan yang telah diluluskan (masih aktif, diserahkan, atau dipulangkan). */
const DILULUSKAN = ["approved", "handed_over", "returned"] as const;

const approvedAtYear = (year: number) =>
  sql`extract(year from timezone(${STATS_TZ}, ${equipmentLoanRequests.approvedAt})) = ${year}`;

const handedYear = (year: number) =>
  sql`extract(year from timezone(${STATS_TZ}, ${equipmentLoanRequests.handedOverAt})) = ${year}`;

const returnedYear = (year: number) =>
  sql`extract(year from timezone(${STATS_TZ}, ${equipmentLoanRequests.returnedAt})) = ${year}`;

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

export async function getPinjamanAnalisis(year: number): Promise<PinjamanAnalisis> {
  const diluluskanWhere = and(
    inArray(equipmentLoanRequests.status, [...DILULUSKAN]),
    approvedAtYear(year),
  );

  const [kpiDiluluskan, kpiUnit, kpiPulang, pkgRows, jenisRows, monthRows, pkgNames] =
    await Promise.all([
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(equipmentLoanRequests)
        .where(diluluskanWhere),
      db
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
            handedYear(year),
          ),
        ),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(equipmentLoanRequests)
        .where(and(eq(equipmentLoanRequests.status, "returned"), returnedYear(year))),
      db
        .select({
          pkgId: equipmentLoanRequests.pkgId,
          jumlah: sql<number>`count(*)::int`,
        })
        .from(equipmentLoanRequests)
        .where(diluluskanWhere)
        .groupBy(equipmentLoanRequests.pkgId),
      db
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
        .limit(8),
      db
        .select({
          bulan: sql<number>`extract(month from timezone('Asia/Kuala_Lumpur', ${equipmentLoanRequests.approvedAt}))::int`,
          jumlah: sql<number>`count(*)::int`,
        })
        .from(equipmentLoanRequests)
        .where(diluluskanWhere)
        .groupBy(sql`1`),
      db
        .select({ id: pkgs.id, name: pkgs.name })
        .from(pkgs)
        .orderBy(pkgs.name),
    ]);

  const pkgCount = new Map(pkgRows.map((r) => [r.pkgId, r.jumlah]));

  return {
    kpi: [
      { label: "Permohonan diluluskan", value: kpiDiluluskan[0]?.n ?? 0 },
      { label: "Unit diserahkan", value: kpiUnit[0]?.n ?? 0 },
      { label: "Sudah dipulangkan", value: kpiPulang[0]?.n ?? 0 },
    ],
    byPkg: pkgNames.map((pkg) => ({
      label: pkg.name,
      jumlah: pkgCount.get(pkg.id) ?? 0,
    })),
    byJenis: jenisRows
      .filter((r) => r.jumlah > 0)
      .map((r) => ({ label: r.name, jumlah: r.jumlah })),
    monthly: fillMonths(new Map(monthRows.map((r) => [r.bulan, r.jumlah]))),
  };
}

export async function minPinjamanYear(): Promise<number | null> {
  const [row] = await db
    .select({
      min: sql<number | null>`min(extract(year from timezone(${STATS_TZ}, ${equipmentLoanRequests.approvedAt})))::int`,
    })
    .from(equipmentLoanRequests)
    .where(inArray(equipmentLoanRequests.status, [...DILULUSKAN]));
  return row?.min ?? null;
}
