import "server-only";

import { kenalJenisSekolah, labelJenisSekolah, type JenisSekolah } from "./jenis-sekolah";
import {
  listMaklumBalasMesyuarat,
  listPerkara,
  listSekolahSemua,
  type MaklumBalasItemRow,
  type MaklumBalasRow,
  type PerkaraRow,
} from "./queries";
import { csvMaklumBalasMjkd } from "./csv";

export type SekolahAdmin = {
  code: string;
  name: string;
  zone: string;
  jenis: JenisSekolah | null;
};

export type DataMaklumBalasAdmin = {
  perkara: PerkaraRow[];
  sekolah: SekolahAdmin[];
  maklumBalas: MaklumBalasRow[];
  items: MaklumBalasItemRow[];
  /** kod sekolah -> maklum balas */
  mbMengikutKod: Map<string, MaklumBalasRow>;
  /** `${maklumBalasId}:${perkaraId}` -> item */
  itemMengikutKunci: Map<string, MaklumBalasItemRow>;
};

export const kunciItem = (maklumBalasId: string, perkaraId: string) =>
  `${maklumBalasId}:${perkaraId}`;

/** Semua data (perkara, sekolah, maklum balas, jawapan) satu mesyuarat untuk paparan admin. */
export async function muatDataMaklumBalasAdmin(
  mesyuaratId: string,
): Promise<DataMaklumBalasAdmin> {
  // Berurutan, bukan Promise.all: kolam serverless hanya 3 sambungan — satu soket mati tidak
  // sepatutnya menyekat semua query serentak (lihat lib/db.ts).
  const perkara = await listPerkara(mesyuaratId);
  const sekolahRows = await listSekolahSemua();
  const { maklumBalas, items } = await listMaklumBalasMesyuarat(mesyuaratId);
  return {
    perkara,
    sekolah: sekolahRows.map((s) => ({ ...s, jenis: kenalJenisSekolah(s.name, s.code) })),
    maklumBalas,
    items,
    mbMengikutKod: new Map(maklumBalas.map((m) => [m.schoolCode, m])),
    itemMengikutKunci: new Map(items.map((it) => [kunciItem(it.maklumBalasId, it.perkaraId), it])),
  };
}

/** CSV semua jawapan (UTF-8 BOM) untuk satu mesyuarat — satu baris setiap sekolah × perkara. */
export async function binaCsvMaklumBalasMesyuarat(mesyuaratId: string): Promise<string> {
  const data = await muatDataMaklumBalasAdmin(mesyuaratId);
  const baris: Parameters<typeof csvMaklumBalasMjkd>[0][number][] = [];
  const perkaraMengikutId = new Map(data.perkara.map((p) => [p.id, p]));
  const sekolahMengikutKod = new Map(data.sekolah.map((s) => [s.code, s]));

  for (const mb of [...data.maklumBalas].sort((a, b) => a.schoolCode.localeCompare(b.schoolCode))) {
    const sekolah = sekolahMengikutKod.get(mb.schoolCode);
    if (!sekolah) continue;
    const jawapan = data.items.filter((it) => it.maklumBalasId === mb.id);
    // Ikut susunan perkara dalam minit.
    const diisih = [...jawapan].sort(
      (a, b) =>
        (perkaraMengikutId.get(a.perkaraId)?.sort ?? 0) -
        (perkaraMengikutId.get(b.perkaraId)?.sort ?? 0),
    );
    for (const it of diisih) {
      const p = perkaraMengikutId.get(it.perkaraId);
      if (!p) continue;
      baris.push({
        kodSekolah: sekolah.code,
        namaSekolah: sekolah.name,
        jenis: labelJenisSekolah(sekolah.jenis),
        zon: sekolah.zone,
        para: p.para,
        mukaSurat: p.mukaSurat,
        perkara: p.perkara,
        status: it.status,
        catatan: it.catatan,
        pautanBukti: it.pautanBukti,
        fotoBukti: it.fotoBukti,
        namaPengisi: mb.namaPengisi,
        jawatanPengisi: mb.jawatanPengisi,
        tarikhHantar: mb.tarikhHantar.toISOString(),
        dipilih: it.dipilih,
        susunanBacaan: it.susunanBacaan,
      });
    }
  }
  return csvMaklumBalasMjkd(baris);
}

