import "server-only";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, pkgs } from "@/lib/schema";
import { fillMonths } from "./year";
import type { BreakdownPoint, MonthPoint, StatKpi } from "./types";

/**
 * Statistik Tempahan PKG — status `approved` sahaja.
 * Aktiviti = coalesce(group_id, id) supaya tempahan lintas hari dikira sekali.
 */
const activityId = sql`coalesce(${bookings.groupId}::text, ${bookings.id}::text)`;

function yearCond(year: number) {
  return and(gte(bookings.date, `${year}-01-01`), lt(bookings.date, `${year + 1}-01-01`));
}

export type TempahanAnalisis = {
  kpi: StatKpi[];
  byPkg: BreakdownPoint[];
  bySlot: BreakdownPoint[];
  monthly: MonthPoint[];
};

export function emptyTempahanAnalisis(): TempahanAnalisis {
  return {
    kpi: [
      { label: "Aktiviti diluluskan", value: 0 },
      { label: "Hari penggunaan", value: 0 },
    ],
    byPkg: [],
    bySlot: [
      { label: "Pagi", jumlah: 0 },
      { label: "Petang", jumlah: 0 },
      { label: "Sepenuh hari", jumlah: 0 },
    ],
    monthly: fillMonths(new Map()),
  };
}

const SLOT_LABEL: Record<string, string> = {
  am: "Pagi",
  pm: "Petang",
  full_day: "Sepenuh hari",
};

type ActivityRow = {
  aid: string;
  pkgId: string;
  startMonth: number | null;
  hari: number;
};

async function loadActivityRows(year: number): Promise<ActivityRow[]> {
  const whereYear = and(eq(bookings.status, "approved"), yearCond(year));
  return db
    .select({
      aid: sql<string>`${activityId}`,
      pkgId: sql<string>`min(${bookings.pkgId})`,
      startMonth: sql<number>`extract(month from min(${bookings.date}))::int`,
      hari: sql<number>`count(distinct ${bookings.date})::int`,
    })
    .from(bookings)
    .where(whereYear)
    .groupBy(activityId);
}

function kpiFromRows(rows: ActivityRow[]): StatKpi[] {
  let hari = 0;
  for (const row of rows) hari += row.hari ?? 0;
  return [
    { label: "Aktiviti diluluskan", value: rows.length },
    { label: "Hari penggunaan", value: hari },
  ];
}

export async function getTempahanKpi(year: number): Promise<StatKpi[]> {
  const whereYear = and(eq(bookings.status, "approved"), yearCond(year));
  const activity = db
    .select({
      aid: sql<string>`${activityId}`.as("aid"),
      hari: sql<number>`count(distinct ${bookings.date})::int`.as("hari"),
    })
    .from(bookings)
    .where(whereYear)
    .groupBy(activityId)
    .as("activity");
  const [row] = await db
    .select({
      aktiviti: sql<number>`count(*)::int`,
      hari: sql<number>`coalesce(sum(${activity.hari}), 0)::int`,
    })
    .from(activity);
  return [
    { label: "Aktiviti diluluskan", value: row?.aktiviti ?? 0 },
    { label: "Hari penggunaan", value: row?.hari ?? 0 },
  ];
}

export async function getTempahanAnalisis(year: number): Promise<TempahanAnalisis> {
  const whereYear = and(eq(bookings.status, "approved"), yearCond(year));
  const activityRows = await loadActivityRows(year);
  const slotRows = await db
    .select({
      slot: bookings.slot,
      jumlah: sql<number>`count(*)::int`,
    })
    .from(bookings)
    .where(whereYear)
    .groupBy(bookings.slot);
  const pkgNames = await db.select({ id: pkgs.id, name: pkgs.name }).from(pkgs).orderBy(pkgs.name);

  const pkgCount = new Map<string, number>();
  const monthMap = new Map<number, number>();
  for (const row of activityRows) {
    pkgCount.set(row.pkgId, (pkgCount.get(row.pkgId) ?? 0) + 1);
    if (row.startMonth == null) continue;
    monthMap.set(row.startMonth, (monthMap.get(row.startMonth) ?? 0) + 1);
  }
  const slotCount = new Map(slotRows.map((r) => [r.slot, r.jumlah]));

  return {
    kpi: kpiFromRows(activityRows),
    byPkg: pkgNames.map((pkg) => ({
      label: pkg.name,
      jumlah: pkgCount.get(pkg.id) ?? 0,
    })),
    bySlot: (["am", "pm", "full_day"] as const).map((slot) => ({
      label: SLOT_LABEL[slot],
      jumlah: slotCount.get(slot) ?? 0,
    })),
    monthly: fillMonths(monthMap),
  };
}

export async function minTempahanYear(): Promise<number | null> {
  const [row] = await db
    .select({
      min: sql<number | null>`min(${bookings.date})`,
    })
    .from(bookings)
    .where(eq(bookings.status, "approved"));
  if (!row?.min) return null;
  return Number(String(row.min).slice(0, 4));
}
