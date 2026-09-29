import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisBreakdown, analisisMetrics } from "@/lib/schema";
import type { analisisModul } from "@/lib/schema";
import { after } from "next/server";
import { fetchDelimaLive, fetchDelimaSchools, type DelimaLive, type DelimaSchoolList } from "./delima-live";
import { ensureDelimaSnapshot, getDelimaCapaiTerkini, getDelimaSnapshotTrend } from "./delima-snapshot";

export type AnalisisModul = (typeof analisisModul.enumValues)[number];

export type MetricMap = Map<string, string>;

export type BreakdownRow = { kind: string; label: string; value: number };

export type AnalisisData = {
  /** Data DELIMa langsung (hanya modul `delima`, jika sumber dapat dicapai). */
  live?: DelimaLive | null;
  /** Senarai sekolah langsung (modul `delima`) — asas carta taburan tahap. */
  liveSchools?: DelimaSchoolList | null;
  /** Titik trend daripada snapshot bulanan (modul `delima`); kosong jika belum ada. */
  snapshotTrend?: { bulan: string; guru: number; murid: number }[];
  /**
   * Sekolah yang capai sasaran: guru = guru DELIMa 2.0 ≥ sasaran KPI guru (dikira langsung);
   * murid = kad "Aktif Murid" sekolah capai (daripada snapshot). null jika belum ada.
   */
  capaiSekolah?: { guru: number | null; murid: number | null; jumlah: number | null } | null;
  metrics: MetricMap;
  breakdown: BreakdownRow[];
};

function delimaConfigDariMetrics(metrics: MetricMap) {
  return {
    url: metrics.get("delima_live_url")?.trim() || undefined,
    daerah: metrics.get("delima_daerah")?.trim() || undefined,
  };
}

/** Konfigurasi sumber DELIMa langsung sahaja (tanpa ambil data) — untuk server action ringan. */
export async function getDelimaConfig() {
  const rows = await db
    .select()
    .from(analisisMetrics)
    .where(eq(analisisMetrics.modul, "delima"));
  return delimaConfigDariMetrics(new Map(rows.map((r) => [r.key.toLowerCase(), r.value])));
}

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
  let snapshotTrend: { bulan: string; guru: number; murid: number }[] = [];
  let capaiSekolah: AnalisisData["capaiSekolah"] = null;
  if (modul === "delima") {
    const cfg = delimaConfigDariMetrics(metrics);
    [live, liveSchools] = await Promise.all([
      fetchDelimaLive(cfg.url, cfg.daerah),
      fetchDelimaSchools(cfg.url, cfg.daerah),
    ]);
    if (live?.bilSekolah != null) metrics.set("bil_sekolah", String(live.bilSekolah));
    if (live) {
      const l = live;
      const s = liveSchools;
      try {
        // Snapshot bulanan automatik: dicipta selepas respons dihantar jika tempoh ini belum ada.
        after(() =>
          ensureDelimaSnapshot(l, s, cfg.url, cfg.daerah).catch((e) =>
            console.error("[delima-snapshot]", e),
          ),
        );
      } catch {
        /* di luar skop permintaan (cth. build) — cron akan menyimpan */
      }
    }
    snapshotTrend = await getDelimaSnapshotTrend().catch(() => []);
    const snapCapai = await getDelimaCapaiTerkini().catch(() => null);
    const kpiGuru = Number(metrics.get("kpi_guru")?.replace(",", "."));
    const guruCapai =
      liveSchools && Number.isFinite(kpiGuru) && kpiGuru > 0
        ? liveSchools.schools.filter((r) => (r.guru?.peratus ?? -1) >= kpiGuru).length
        : null;
    const jumlahSekolah = liveSchools?.schools.length ?? snapCapai?.jumlah ?? null;
    if (guruCapai != null || snapCapai) {
      capaiSekolah = { guru: guruCapai, murid: snapCapai?.capai ?? null, jumlah: jumlahSekolah };
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
): { bulan: string; guru: number | null; murid: number | null }[] {
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
