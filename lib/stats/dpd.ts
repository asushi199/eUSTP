import "server-only";

import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { laporanDpd } from "@/lib/schema";
import type { BreakdownPoint, MonthPoint, StatKpi } from "./types";

/**
 * Statistik Laporan DPD — setiap statistik = satu fungsi berasingan supaya
 * definisi mudah diubah kelak tanpa sentuh halaman.
 * Semua laporan dikira serta-merta (tiada tapisan status/kelulusan).
 */

const BULAN_PENDEK = [
  "Jan", "Feb", "Mac", "Apr", "Mei", "Jun",
  "Jul", "Ogs", "Sep", "Okt", "Nov", "Dis",
];

export type DpdSummary = {
  jumlahProgram: number;
  bilMurid: number;
  bilPendidik: number;
  bilPemimpin: number;
  bilSwasta: number;
};

export async function getDpdSummary(year?: number): Promise<DpdSummary> {
  const cond = year != null ? sql`extract(year from ${laporanDpd.tarikh}) = ${year}` : sql`true`;
  const [row] = await db
    .select({
      jumlahProgram: sql<number>`count(*)::int`,
      bilMurid: sql<number>`coalesce(sum(${laporanDpd.bilMurid}), 0)::int`,
      bilPendidik: sql<number>`coalesce(sum(${laporanDpd.bilGuru}), 0)::int`,
      bilPemimpin: sql<number>`coalesce(sum(${laporanDpd.bilPentadbir}), 0)::int`,
      bilSwasta: sql<number>`coalesce(sum(${laporanDpd.bilSwasta}), 0)::int`,
    })
    .from(laporanDpd)
    .where(cond);
  return row;
}

/** Petak KPI untuk paparan (susunan tetap, label BM). */
export async function getDpdKpiTiles(year?: number): Promise<StatKpi[]> {
  const s = await getDpdSummary(year);
  return [
    { label: "Jumlah Program", value: s.jumlahProgram },
    { label: "Bil. Murid", value: s.bilMurid },
    { label: "Bil. Pendidik", value: s.bilPendidik },
    { label: "Bil. Pemimpin", value: s.bilPemimpin },
    { label: "Bil. Warga Swasta", value: s.bilSwasta },
  ];
}

/** Bilangan program sebulan untuk tahun diberi (12 titik, bulan kosong = 0). */
export async function getDpdMonthly(year: number): Promise<MonthPoint[]> {
  const rows = await db
    .select({
      bulan: sql<number>`extract(month from ${laporanDpd.tarikh})::int`,
      jumlah: sql<number>`count(*)::int`,
    })
    .from(laporanDpd)
    .where(sql`extract(year from ${laporanDpd.tarikh}) = ${year}`)
    .groupBy(sql`extract(month from ${laporanDpd.tarikh})`);
  const byMonth = new Map(rows.map((r) => [r.bulan, r.jumlah]));
  return BULAN_PENDEK.map((bulan, i) => ({ bulan, jumlah: byMonth.get(i + 1) ?? 0 }));
}

/** Normalise teras teks bebas → label pendek "Teras N" (kekal teks asal jika tiada nombor). */
function terasLabel(teras: string): string {
  const m = teras.match(/teras\s*:?\s*(\d)/i);
  if (m) return `Teras ${m[1]}`;
  const t = teras.trim();
  return t ? (t.length > 28 ? `${t.slice(0, 28)}…` : t) : "Tidak dinyatakan";
}

/** Bilangan program mengikut teras (label dinormalise dalam fungsi ini sahaja). */
export async function getDpdByTeras(year?: number): Promise<BreakdownPoint[]> {
  const cond = year != null ? sql`extract(year from ${laporanDpd.tarikh}) = ${year}` : sql`true`;
  const rows = await db
    .select({ teras: laporanDpd.teras, jumlah: sql<number>`count(*)::int` })
    .from(laporanDpd)
    .where(cond)
    .groupBy(laporanDpd.teras);
  const merged = new Map<string, number>();
  for (const r of rows) {
    const label = terasLabel(r.teras);
    merged.set(label, (merged.get(label) ?? 0) + r.jumlah);
  }
  return [...merged.entries()]
    .map(([label, jumlah]) => ({ label, jumlah }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export type DpdListItem = {
  id: number;
  tarikh: string;
  organisasi: string;
  namaProgram: string;
  jenisProgram: string;
};

/** Senarai awam laporan DPD (terbaru dahulu, muka surat 1-indexed). */
export async function listDpdPublic(page: number, perPage = 20) {
  const offset = (Math.max(1, page) - 1) * perPage;
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: laporanDpd.id,
        tarikh: laporanDpd.tarikh,
        organisasi: laporanDpd.organisasi,
        namaProgram: laporanDpd.namaProgram,
        jenisProgram: laporanDpd.jenisProgram,
      })
      .from(laporanDpd)
      .orderBy(desc(laporanDpd.tarikh), desc(laporanDpd.id))
      .limit(perPage)
      .offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(laporanDpd),
  ]);
  return { items: items as DpdListItem[], total, perPage };
}
