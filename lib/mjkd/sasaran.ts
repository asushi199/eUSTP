import { isSasaranMjkd } from "./enums";
import { kenalJenisSekolah, peringkat, type SekolahRingkas } from "./jenis-sekolah";

export type PerkaraSasaran = {
  sasaran: string;
  sekolahKhusus: string[];
  aktif?: boolean;
};

/**
 * Perkara yang terpakai kepada satu sekolah.
 * - `sekolahKhusus` tidak kosong: hanya kod yang disenaraikan (mengatasi sasaran).
 * - Selain itu: SEMUA / SR / SM / SJK (= SJKC + SJKT).
 * - Perkara `aktif === false` tidak termasuk.
 * Sekolah yang jenisnya tidak dikenali hanya menerima SEMUA dan perkara khusus.
 */
export function perkaraUntukSekolah<T extends PerkaraSasaran>(
  perkara: readonly T[],
  school: SekolahRingkas,
): T[] {
  const jenis = kenalJenisSekolah(school.name, school.code);
  const kod = school.code.trim().toUpperCase();
  return perkara.filter((p) => {
    if (p.aktif === false) return false;
    if (p.sekolahKhusus.length > 0) {
      return p.sekolahKhusus.some((k) => k.trim().toUpperCase() === kod);
    }
    if (!isSasaranMjkd(p.sasaran)) return false;
    switch (p.sasaran) {
      case "SEMUA":
        return true;
      case "SR":
        return jenis !== null && peringkat(jenis) === "SR";
      case "SM":
        return jenis !== null && peringkat(jenis) === "SM";
      case "SJK":
        return jenis === "SJKC" || jenis === "SJKT";
    }
  });
}

/** Ringkasan sasaran untuk paparan admin. */
export function labelSasaranPerkara(
  p: { sasaran: string; sekolahKhusus: string[] },
  namaMengikutKod?: ReadonlyMap<string, string>,
): string {
  if (p.sekolahKhusus.length > 0) {
    return p.sekolahKhusus.map((k) => namaMengikutKod?.get(k) ?? k).join(", ");
  }
  return p.sasaran || "—";
}
