import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  mjkdBahan,
  mjkdKehadiran,
  mjkdMaklumBalas,
  mjkdMesyuarat,
  mjkdPerkara,
  pegawaiPpd,
} from "@/lib/schema";
import { MINIT_RUJUKAN } from "./acara";
import { hariIniKl } from "./enums";
import type { DataPentas, RekodKehadiranSlaid, VersiPentas } from "./pembentangan";
import {
  getMesyuarat,
  listBahan,
  listMaklumBalasMesyuarat,
  listPerkara,
  listSekolahSemua,
} from "./queries";

/**
 * Data mod pembentangan (v2). Semua query BERURUTAN (kolam serverless ~3 sambungan) — pemanggil
 * membungkus dalam `withDbTimeout`. Tiada QR/URL (tidak berubah; dijana sekali oleh halaman).
 */

/** Rekod kehadiran + sektor pegawai (pegawai "Tiada dalam senarai" = sektor kosong). */
export async function muatKehadiranPentas(
  mesyuaratId: string,
): Promise<DataPentas["kehadiran"]> {
  const rows = await db
    .select({
      jenis: mjkdKehadiran.jenis,
      schoolCode: mjkdKehadiran.schoolCode,
      tarikh: mjkdKehadiran.tarikh,
      sektor: pegawaiPpd.sektor,
    })
    .from(mjkdKehadiran)
    .leftJoin(pegawaiPpd, eq(mjkdKehadiran.pegawaiPpdId, pegawaiPpd.id))
    .where(eq(mjkdKehadiran.mesyuaratId, mesyuaratId));
  const rekod: RekodKehadiranSlaid[] = rows.map((r) => ({
    jenis: r.jenis,
    schoolCode: r.schoolCode,
    tarikh: r.tarikh,
    sektor: r.sektor ?? "",
  }));
  return { hariIni: hariIniKl(), rekod };
}

export async function muatDataPentas(mesyuaratId: string): Promise<DataPentas | null> {
  const mesyuarat = await getMesyuarat(mesyuaratId);
  if (!mesyuarat) return null;
  const perkara = await listPerkara(mesyuarat.id);
  const sekolah = await listSekolahSemua();
  const { maklumBalas, items } = await listMaklumBalasMesyuarat(mesyuarat.id);
  const bahan = await listBahan(mesyuarat.id);
  const kehadiran = await muatKehadiranPentas(mesyuarat.id);
  return {
    // Minit/perkara berasal daripada Bil.1/2026 tetapi disimpan pada rekod acara ini.
    rujukan: {
      bil: 1,
      tahun: mesyuarat.tahun,
      tarikh: MINIT_RUJUKAN.tarikh,
      tempat: MINIT_RUJUKAN.tempat,
      minitUrl: mesyuarat.minitUrl,
    },
    perkara: perkara.map((p) => ({
      id: p.id,
      para: p.para,
      mukaSurat: p.mukaSurat,
      perkara: p.perkara,
      tindakan: p.tindakan,
      sasaran: p.sasaran,
      sekolahKhusus: p.sekolahKhusus,
      aktif: p.aktif,
      sort: p.sort,
    })),
    sekolah: sekolah.map((s) => ({ code: s.code, name: s.name })),
    maklumBalas: maklumBalas.map((m) => ({
      id: m.id,
      schoolCode: m.schoolCode,
      namaPengisi: m.namaPengisi,
      jawatanPengisi: m.jawatanPengisi,
      tarikhHantar: m.tarikhHantar.toISOString(),
    })),
    items: items.map((it) => ({
      id: it.id,
      maklumBalasId: it.maklumBalasId,
      perkaraId: it.perkaraId,
      status: it.status,
      catatan: it.catatan,
      pautanBukti: it.pautanBukti,
      fotoBukti: it.fotoBukti,
      dipilih: it.dipilih,
    })),
    bahan: bahan.map((b) => ({
      id: b.id,
      sektorUnit: b.sektorUnit,
      tajuk: b.tajuk,
      namaPembentang: b.namaPembentang,
      hari: b.hari,
      jenis: b.jenis,
      url: b.url,
      storagePath: b.storagePath,
      createdAt: b.createdAt.toISOString(),
    })),
    kehadiran,
    dimuatPada: new Date().toISOString(),
  };
}

/**
 * Tandatangan ringan (satu query) untuk polling: `utama` berubah bila maklum balas / perkara /
 * bahan / minit berubah (muat semula penuh); `hadir` berubah bila ada rekod kehadiran baharu atau
 * dipadam (muat semula kehadiran sahaja).
 */
export async function versiPentas(mesyuaratId: string): Promise<VersiPentas | null> {
  const [r] = await db
    .select({
      mesyuarat: sql<string>`${mjkdMesyuarat.updatedAt}::text`,
      mb: sql<string>`(select count(*) || '/' || coalesce(max(${mjkdMaklumBalas.updatedAt})::text, '') || '/' || coalesce(max(${mjkdMaklumBalas.tarikhHantar})::text, '') from ${mjkdMaklumBalas} where ${mjkdMaklumBalas.mesyuaratId} = ${mjkdMesyuarat.id})`,
      perkara: sql<string>`(select count(*) filter (where ${mjkdPerkara.aktif}) || '/' || count(*) from ${mjkdPerkara} where ${mjkdPerkara.mesyuaratId} = ${mjkdMesyuarat.id})`,
      bahan: sql<string>`(select count(*) || '/' || coalesce(max(${mjkdBahan.updatedAt})::text, '') from ${mjkdBahan} where ${mjkdBahan.mesyuaratId} = ${mjkdMesyuarat.id})`,
      hadir: sql<string>`(select count(*) || '/' || coalesce(max(${mjkdKehadiran.createdAt})::text, '') from ${mjkdKehadiran} where ${mjkdKehadiran.mesyuaratId} = ${mjkdMesyuarat.id})`,
    })
    .from(mjkdMesyuarat)
    .where(eq(mjkdMesyuarat.id, mesyuaratId))
    .limit(1);
  if (!r) return null;
  return {
    utama: [r.mesyuarat, r.mb, r.perkara, r.bahan].join("|"),
    hadir: `${hariIniKl()}|${r.hadir}`,
  };
}
