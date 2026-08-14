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

const DEFAULT_TOV_YEAR = "2024";

/** Tahun label TOV carta AI Tools. Pentadbir tetapkan kunci `tov_year` (cth. 2025). */
export function optikTovYear(metrics: MetricMap): string {
  const year = metricText(metrics, "tov_year");
  return /^\d{4}$/.test(year) ? year : DEFAULT_TOV_YEAR;
}

/** Label paksi-X titik pertama carta AI Tools, cth. "TOV 2025". */
export function optikTovLabel(metrics: MetricMap): string {
  return `TOV ${optikTovYear(metrics)}`;
}

/** Peratus TOV — utamakan `tov`, kemudian kunci berasaskan tahun, kemudian `tov2024`. */
export function optikTovValue(metrics: MetricMap): number | null {
  const year = optikTovYear(metrics);
  return metricNum(metrics, "tov", `tov${year}`, `tov_${year}`, "tov2024", "tov_2024");
}

/**
 * Anggar bilangan "belum selesai" daripada bilangan "selesai" + peratusan kedua-duanya
 * (cth. OPTIK hanya simpan bilangan siap, bukan bilangan belum siap).
 */
export function deriveBelumBil(
  selesaiBil: number | null,
  selesaiPct: number | null,
  belumPct: number | null,
): number | null {
  if (selesaiBil == null || !selesaiPct || belumPct == null) return null;
  const anggaran = Math.round(selesaiBil * (belumPct / selesaiPct));
  return anggaran >= 0 ? anggaran : null;
}
