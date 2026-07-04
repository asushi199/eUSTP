import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { laporanDpd, laporanPhotos, laporanPss } from "@/lib/schema";
import type { LaporanModul } from "./photos";

export type LaporanPhoto = {
  id: number;
  storagePath: string;
  publicUrl: string;
  sortOrder: number;
};

export async function getLaporanPhotos(
  modul: LaporanModul,
  laporanId: number,
): Promise<LaporanPhoto[]> {
  return db
    .select({
      id: laporanPhotos.id,
      storagePath: laporanPhotos.storagePath,
      publicUrl: laporanPhotos.publicUrl,
      sortOrder: laporanPhotos.sortOrder,
    })
    .from(laporanPhotos)
    .where(and(eq(laporanPhotos.modul, modul), eq(laporanPhotos.laporanId, laporanId)))
    .orderBy(laporanPhotos.sortOrder);
}

export async function getLaporanDpd(id: number) {
  const row = await db.query.laporanDpd.findFirst({ where: eq(laporanDpd.id, id) });
  if (!row) return null;
  const photos = await getLaporanPhotos("dpd", id);
  return { ...row, photos };
}

export async function getLaporanPss(id: number) {
  const row = await db.query.laporanPss.findFirst({ where: eq(laporanPss.id, id) });
  if (!row) return null;
  const photos = await getLaporanPhotos("pss", id);
  return { ...row, photos };
}

export async function listLaporanDpd() {
  return db.select().from(laporanDpd).orderBy(desc(laporanDpd.tarikh), desc(laporanDpd.id));
}

export async function listLaporanPss() {
  return db
    .select()
    .from(laporanPss)
    .orderBy(desc(laporanPss.tarikhMula), desc(laporanPss.id));
}

/** Statistik PSS: bilangan laporan sebulan (untuk carta admin). */
export async function pssMonthlyCounts(): Promise<{ bulan: string; jumlah: number }[]> {
  const rows = await db
    .select({
      bulan: sql<string>`to_char(${laporanPss.tarikhMula}, 'YYYY-MM')`,
      jumlah: sql<number>`count(*)::int`,
    })
    .from(laporanPss)
    .groupBy(sql`to_char(${laporanPss.tarikhMula}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${laporanPss.tarikhMula}, 'YYYY-MM')`);
  return rows;
}
