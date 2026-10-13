import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  analisisAinsMurid,
  analisisAinsMuridBulanan,
  analisisAinsSekolah,
  schools as schoolTable,
} from "@/lib/schema";
import type { AinsMuridRow, AinsSekolahRow, AinsTahunData } from "./ains-types";

/** Tahun yang ada data Ains dalam pangkalan data, terkini dahulu. */
export async function listAinsTahun(): Promise<number[]> {
  const rows = await db
    .selectDistinct({ tahun: analisisAinsSekolah.tahun })
    .from(analisisAinsSekolah)
    .orderBy(desc(analisisAinsSekolah.tahun));
  return rows.map((r) => r.tahun);
}

/** Ringkasan semua sekolah, semua bulan, satu tahun. Nama diseragamkan dengan direktori. */
export async function getAinsTahun(tahun: number): Promise<AinsTahunData | null> {
  const [rows, direktori] = await Promise.all([
    db
      .select()
      .from(analisisAinsSekolah)
      .where(eq(analisisAinsSekolah.tahun, tahun))
      .orderBy(asc(analisisAinsSekolah.bulan), asc(analisisAinsSekolah.kod)),
    db
      .select({ code: schoolTable.code, name: schoolTable.name })
      .from(schoolTable)
      .catch(() => []),
  ]);
  if (rows.length === 0) return null;
  const names = new Map(direktori.map((r) => [r.code, r.name]));
  const sekolah: AinsSekolahRow[] = rows.map((r) => ({
    bulan: r.bulan,
    kod: r.kod,
    nama: names.get(r.kod) ?? r.nama,
    jenis: r.jenis,
    tahap: r.tahap,
    murid: r.murid,
    ditolak: r.ditolak,
    lulus: r.lulus,
    purata: r.purata,
    muridMembaca: r.muridMembaca,
    eng: r.eng,
    bm: r.bm,
    lain: r.lain,
    mukaSurat: r.mukaSurat,
    star: r.star,
  }));
  return { tahun, bulan: [...new Set(sekolah.map((r) => r.bulan))].sort((a, b) => a - b), sekolah };
}

/** Murid satu sekolah dengan bacaan setiap bulan (e-mel tidak dipulangkan). */
export async function getAinsMuridSekolah(tahun: number, kod: string): Promise<AinsMuridRow[]> {
  const rows = await db
    .select({
      id: analisisAinsMurid.id,
      nama: analisisAinsMurid.nama,
      bulan: analisisAinsMuridBulanan.bulan,
      lulus: analisisAinsMuridBulanan.lulus,
      ditolak: analisisAinsMuridBulanan.ditolak,
      eng: analisisAinsMuridBulanan.eng,
      bm: analisisAinsMuridBulanan.bm,
      lain: analisisAinsMuridBulanan.lain,
      mukaSurat: analisisAinsMuridBulanan.mukaSurat,
      star: analisisAinsMuridBulanan.star,
    })
    .from(analisisAinsMuridBulanan)
    .innerJoin(analisisAinsMurid, eq(analisisAinsMurid.id, analisisAinsMuridBulanan.muridId))
    .where(and(eq(analisisAinsMuridBulanan.tahun, tahun), eq(analisisAinsMuridBulanan.kod, kod)))
    .orderBy(asc(analisisAinsMurid.nama), asc(analisisAinsMuridBulanan.bulan));
  const peta = new Map<number, AinsMuridRow>();
  for (const r of rows) {
    const m = peta.get(r.id) ?? { id: r.id, nama: r.nama, b: [] };
    m.b.push({
      bulan: r.bulan,
      lulus: r.lulus,
      ditolak: r.ditolak,
      eng: r.eng,
      bm: r.bm,
      lain: r.lain,
      mukaSurat: r.mukaSurat,
      star: r.star,
    });
    peta.set(r.id, m);
  }
  return [...peta.values()];
}
