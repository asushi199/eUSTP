import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisBreakdown, analisisMetrics } from "@/lib/schema";
import type { analisisModul } from "@/lib/schema";
import { bilSekolahCapai, type DelimaLive, type DelimaSchoolList } from "./delima-live";
import {
  getDelimaCapaiTerkini,
  getDelimaSnapshotTrend,
  getDelimaTerkini,
  type DelimaTrendPoint,
} from "./delima-snapshot";

export type AnalisisModul = (typeof analisisModul.enumValues)[number];

export type MetricMap = Map<string, string>;

export type BreakdownRow = { kind: string; label: string; value: number };

export type AnalisisData = {
  /** Data DELIMa semasa (hanya modul `delima`): snapshot d3 terbaharu; null jika belum diimport. */
  live?: DelimaLive | null;
  /** Senarai sekolah snapshot d3 terbaharu (modul `delima`) — asas carta taburan tahap. */
  liveSchools?: DelimaSchoolList | null;
  /** Titik trend daripada snapshot bulanan (modul `delima`); kosong jika belum ada. */
  snapshotTrend?: DelimaTrendPoint[];
  /**
   * Sekolah yang capai sasaran: peratus aktif guru/murid sekolah ≥ sasaran KPI masing-masing
   * (dikira terus daripada senarai sekolah langsung; murid jatuh balik ke snapshot). null jika belum ada.
   */
  capaiSekolah?: { guru: number | null; murid: number | null; jumlah: number | null } | null;
  metrics: MetricMap;
  breakdown: BreakdownRow[];
};

/** Semua data satu modul (metrik KV + pecahan). */
export async function getAnalisisData(modul: AnalisisModul): Promise<AnalisisData> {
  const metricRows = await db
    .select()
    .from(analisisMetrics)
    .where(eq(analisisMetrics.modul, modul));
  const breakdownRows = await db
    .select()
    .from(analisisBreakdown)
    .where(eq(analisisBreakdown.modul, modul))
    .orderBy(asc(analisisBreakdown.sort));

  const metrics: MetricMap = new Map(metricRows.map((r) => [r.key.toLowerCase(), r.value]));

  let live: DelimaLive | null = null;
  let liveSchools: DelimaSchoolList | null = null;
  let snapshotTrend: DelimaTrendPoint[] = [];
  let capaiSekolah: AnalisisData["capaiSekolah"] = null;
  if (modul === "delima") {
    // Sumber tunggal: snapshot d3.delima.edu.my terbaharu (import manual bulanan).
    const terkini = await getDelimaTerkini().catch(() => null);
    live = terkini?.live ?? null;
    liveSchools = terkini?.schools ?? null;
    if (live?.bilSekolah != null) metrics.set("bil_sekolah", String(live.bilSekolah));
    snapshotTrend = await getDelimaSnapshotTrend().catch(() => []);
    const snapCapai = await getDelimaCapaiTerkini().catch(() => null);
    const num = (k: string) => Number(metrics.get(k)?.replace(",", "."));
    // Sasaran dibandingkan dengan peratus aktif setiap sekolah.
    const guruCapai = bilSekolahCapai(liveSchools, "guru", num("kpi_guru"));
    const muridCapai = bilSekolahCapai(liveSchools, "murid", num("kpi_murid")) ?? snapCapai?.capai ?? null;
    const jumlahSekolah = liveSchools?.schools.length ?? snapCapai?.jumlah ?? null;
    if (guruCapai != null || muridCapai != null) {
      capaiSekolah = { guru: guruCapai, murid: muridCapai, jumlah: jumlahSekolah };
    }
  }

  return {
    live,
    liveSchools,
    snapshotTrend,
    capaiSekolah,
    metrics,
    breakdown: breakdownRows.map((r) => ({ kind: r.kind, label: r.label, value: r.value })),
  };
}

/** Titik carta trend DELIMa: hanya daripada snapshot bulanan automatik (tertua → terbaharu). */
export function delimaTrendPoints(
  data: AnalisisData,
): DelimaTrendPoint[] {
  return data.snapshotTrend ?? [];
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

const DEFAULT_TOV_YEAR = "2025";

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
