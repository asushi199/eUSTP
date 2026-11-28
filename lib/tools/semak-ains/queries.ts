import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { semakAinsLog } from "@/lib/schema";

export type RingkasanSekolahSemakAins = {
  kodSekolah: string | null;
  namaSekolah: string;
  terakhir: string;
  bilSemakan: number;
  bilDisemak: number;
  bilMerah: number;
  bilDiluluskan: number;
  bilDitolak: number;
  tetapanDiubah: boolean;
  tetapanTerkini: Record<string, string | number | boolean> | null;
};

/** Agregat per sekolah dalam SQL (tiada select penuh). */
export async function ringkasanIkutSekolah(): Promise<RingkasanSekolahSemakAins[]> {
  const L = semakAinsLog;
  return db
    .select({
      kodSekolah: L.kodSekolah,
      namaSekolah: sql<string>`max(${L.namaSekolah})`,
      terakhir: sql<string>`max(${L.diciptaPada})`,
      bilSemakan: sql<number>`(count(*) filter (where ${L.jenis} = 'semak'))::int`,
      bilDisemak: sql<number>`coalesce(sum(${L.bilRekod}) filter (where ${L.jenis} = 'semak'), 0)::int`,
      bilMerah: sql<number>`coalesce(sum(${L.bilMerah}) filter (where ${L.jenis} = 'semak'), 0)::int`,
      bilDiluluskan: sql<number>`coalesce(sum(${L.bilBerjaya}) filter (where ${L.jenis} = 'lulus'), 0)::int`,
      bilDitolak: sql<number>`coalesce(sum(${L.bilBerjaya}) filter (where ${L.jenis} = 'tolak'), 0)::int`,
      tetapanDiubah: sql<boolean>`(array_agg(${L.tetapanDiubah} order by ${L.diciptaPada} desc))[1]`,
      tetapanTerkini: sql<Record<string, string | number | boolean> | null>`(array_agg(${L.tetapan} order by ${L.diciptaPada} desc))[1]`,
    })
    .from(L)
    .groupBy(L.kodSekolah, sql`case when ${L.kodSekolah} is null then ${L.namaSekolah} else '' end`)
    .orderBy(desc(sql`max(${L.diciptaPada})`));
}
