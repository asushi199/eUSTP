import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisBreakdown, analisisMetrics, analisisMonthly } from "@/lib/schema";
import type { analisisModul } from "@/lib/schema";

export type AnalisisModul = (typeof analisisModul.enumValues)[number];

export type MetricMap = Map<string, string>;

export type MonthlyRow = {
  monthLabel: string;
  chartLabel: string;
  guruPct: number | null;
  muridPct: number | null;
  includeChart: boolean;
};

export type BreakdownRow = { kind: string; label: string; value: number };

export type AnalisisData = {
  metrics: MetricMap;
  monthly: MonthlyRow[];
  breakdown: BreakdownRow[];
};

/** Semua data satu modul (metrik KV + siri bulanan + pecahan). */
export async function getAnalisisData(modul: AnalisisModul): Promise<AnalisisData> {
  const [metricRows, monthlyRows, breakdownRows] = await Promise.all([
    db.select().from(analisisMetrics).where(eq(analisisMetrics.modul, modul)),
    db
      .select()
      .from(analisisMonthly)
      .where(eq(analisisMonthly.modul, modul))
      .orderBy(asc(analisisMonthly.sort)),
    db
      .select()
      .from(analisisBreakdown)
      .where(eq(analisisBreakdown.modul, modul))
      .orderBy(asc(analisisBreakdown.sort)),
  ]);

  return {
    metrics: new Map(metricRows.map((r) => [r.key.toLowerCase(), r.value])),
    monthly: monthlyRows.map((r) => ({
      monthLabel: r.monthLabel,
      chartLabel: r.chartLabel,
      guruPct: r.guruPct,
      muridPct: r.muridPct,
      includeChart: r.includeChart,
    })),
    breakdown: breakdownRows.map((r) => ({ kind: r.kind, label: r.label, value: r.value })),
  };
}

/** Nombor daripada metrik KV (menyokong koma perpuluhan); null jika tiada/bukan nombor. */
export function metricNum(metrics: MetricMap, ...keys: string[]): number | null {
  for (const key of keys) {
    const raw = metrics.get(key.toLowerCase());
    if (raw == null || raw.trim() === "") continue;
    const n = Number(raw.replace(",", ".").trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Teks daripada metrik KV; "" jika tiada. */
export function metricText(metrics: MetricMap, ...keys: string[]): string {
  for (const key of keys) {
    const raw = metrics.get(key.toLowerCase());
    if (raw != null && raw.trim() !== "") return raw.trim();
  }
  return "";
}
