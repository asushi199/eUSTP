import "server-only";

import { and, eq, sql } from "drizzle-orm";
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
  return sql`extract(year from ${bookings.date}) = ${year}`;
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

export async function getTempahanAnalisis(year: number): Promise<TempahanAnalisis> {
  const whereYear = and(eq(bookings.status, "approved"), yearCond(year));

  const activity = db
    .select({
      aid: sql<string>`${activityId}`.as("aid"),
      pkgId: sql<string>`min(${bookings.pkgId})`.as("pkg_id"),
      startMonth: sql<number>`extract(month from min(${bookings.date}))::int`.as("start_month"),
      hari: sql<number>`count(distinct ${bookings.date})::int`.as("hari"),
    })
    .from(bookings)
    .where(whereYear)
    .groupBy(activityId)
    .as("activity");

  const [kpiRows, pkgRows, slotRows, monthRows, pkgNames] = await Promise.all([
    db
      .select({
        aktiviti: sql<number>`count(*)::int`,
        hari: sql<number>`coalesce(sum(${activity.hari}), 0)::int`,
      })
      .from(activity),
    db
      .select({
        pkgId: activity.pkgId,
        jumlah: sql<number>`count(*)::int`,
      })
      .from(activity)
      .groupBy(activity.pkgId),
    db
      .select({
        slot: bookings.slot,
        jumlah: sql<number>`count(*)::int`,
      })
      .from(bookings)
      .where(whereYear)
      .groupBy(bookings.slot),
    db
      .select({
        bulan: activity.startMonth,
        jumlah: sql<number>`count(*)::int`,
      })
      .from(activity)
      .groupBy(activity.startMonth),
    db.select({ id: pkgs.id, name: pkgs.name }).from(pkgs).orderBy(pkgs.name),
  ]);

  const pkgCount = new Map(pkgRows.map((r) => [r.pkgId, r.jumlah]));
  const slotCount = new Map(slotRows.map((r) => [r.slot, r.jumlah]));

  return {
    kpi: [
      { label: "Aktiviti diluluskan", value: kpiRows[0]?.aktiviti ?? 0 },
      { label: "Hari penggunaan", value: kpiRows[0]?.hari ?? 0 },
    ],
    byPkg: pkgNames.map((pkg) => ({
      label: pkg.name,
      jumlah: pkgCount.get(pkg.id) ?? 0,
    })),
    bySlot: (["am", "pm", "full_day"] as const).map((slot) => ({
      label: SLOT_LABEL[slot],
      jumlah: slotCount.get(slot) ?? 0,
    })),
    monthly: fillMonths(new Map(monthRows.map((r) => [r.bulan, r.jumlah]))),
  };
}

export async function minTempahanYear(): Promise<number | null> {
  const [row] = await db
    .select({
      min: sql<number | null>`min(extract(year from ${bookings.date}))::int`,
    })
    .from(bookings)
    .where(eq(bookings.status, "approved"));
  return row?.min ?? null;
}
