import "server-only";

import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { laporanPss } from "@/lib/schema";
import type { BreakdownPoint, MonthPoint, StatKpi } from "./types";

/**
 * Statistik Laporan PSS — satu statistik satu fungsi (definisi mudah ubah).
 * Semua laporan dikira serta-merta (tiada tapisan status/kelulusan).
 */

const BULAN_PENDEK = [
  "Jan", "Feb", "Mac", "Apr", "Mei", "Jun",
  "Jul", "Ogs", "Sep", "Okt", "Nov", "Dis",
];

export type PssSummary = {
  jumlahLaporan: number;
  laporanBulanIni: number;
  bilSekolahAktif: number;
};

export async function getPssSummary(year?: number): Promise<PssSummary> {
  const cond =
    year != null ? sql`extract(year from ${laporanPss.tarikhMula}) = ${year}` : sql`true`;
  const [row] = await db
    .select({
      jumlahLaporan: sql<number>`count(*)::int`,
      laporanBulanIni: sql<number>`count(*) filter (where date_trunc('month', ${laporanPss.tarikhMula}) = date_trunc('month', now()))::int`,
      bilSekolahAktif: sql<number>`count(distinct ${laporanPss.schoolCode})::int`,
    })
    .from(laporanPss)
    .where(cond);
  return row;
}

export async function getPssKpiTiles(year?: number): Promise<StatKpi[]> {
  const s = await getPssSummary(year);
  return [
    { label: "Jumlah Laporan PSS", value: s.jumlahLaporan },
    { label: "Laporan Bulan Ini", value: s.laporanBulanIni },
    { label: "Sekolah Terlibat", value: s.bilSekolahAktif },
  ];
}

/** Bilangan laporan sebulan untuk tahun diberi (12 titik, bulan kosong = 0). */
export async function getPssMonthly(year: number): Promise<MonthPoint[]> {
  const rows = await db
    .select({
      bulan: sql<number>`extract(month from ${laporanPss.tarikhMula})::int`,
      jumlah: sql<number>`count(*)::int`,
    })
    .from(laporanPss)
    .where(sql`extract(year from ${laporanPss.tarikhMula}) = ${year}`)
    .groupBy(sql`extract(month from ${laporanPss.tarikhMula})`);
  const byMonth = new Map(rows.map((r) => [r.bulan, r.jumlah]));
  return BULAN_PENDEK.map((bulan, i) => ({ bulan, jumlah: byMonth.get(i + 1) ?? 0 }));
}

/**
 * Pecahan ikut dimensi (TV PSS / Literasi Maklumat / Pengurusan / Program
 * Galakan Membaca). Jadual laporan_pss belum ada lajur `dimensi` — fungsi ini
 * memulangkan [] buat masa ini; komponen carta menyembunyikan kad apabila
 * kosong. Selepas migrasi lajur dimensi, kemas kini badan fungsi ini sahaja.
 */
export async function getPssByDimensi(_year?: number): Promise<BreakdownPoint[]> {
  return [];
}

export type PssListItem = {
  id: number;
  tarikhMula: string;
  schoolCode: string;
  schoolName: string;
  namaProgram: string;
};

/** Senarai awam laporan PSS (terbaru dahulu, muka surat 1-indexed). */
export async function listPssPublic(page: number, perPage = 20) {
  const offset = (Math.max(1, page) - 1) * perPage;
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: laporanPss.id,
        tarikhMula: laporanPss.tarikhMula,
        schoolCode: laporanPss.schoolCode,
        schoolName: laporanPss.schoolName,
        namaProgram: laporanPss.namaProgram,
      })
      .from(laporanPss)
      .orderBy(desc(laporanPss.tarikhMula), desc(laporanPss.id))
      .limit(perPage)
      .offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(laporanPss),
  ]);
  return { items: items as PssListItem[], total, perPage };
}
