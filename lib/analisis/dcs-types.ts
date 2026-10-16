/**
 * Snapshot DCS (Digital Competency Score) daripada dcs.moe.edu.my — dibaca manual
 * (log masuk 5 akaun PKG Manjung), disimpan sebagai JSON dalam `analisis_dcs_snapshots`.
 * Hanya data peringkat sekolah/PKG; tiada nama murid atau pengurus.
 */

export type DcsTahapKey = "t6" | "t3" | "t5";

export const DCS_TAHAP: { key: DcsTahapKey; label: string }[] = [
  { key: "t6", label: "Tahun 6" },
  { key: "t3", label: "Tingkatan 3" },
  { key: "t5", label: "Tingkatan 5" },
];

/** Petak papan pemuka PKG: peratus siap + bilangan (murid/sekolah) siap. */
export type DcsTahapStat = { pct: number; bil: number };

export type DcsPkg = {
  pkg: string;
  /** Kedudukan dalam semua PKG Perak. */
  rankPerak: number;
  sekolahSiap: number;
  sekolahJumlah: number;
  muridSiap: number;
  muridJumlah: number;
  pct: number;
  bilSr: number;
  bilSm: number;
  tahap: Partial<Record<DcsTahapKey, DcsTahapStat>>;
  tahapSekolah: Partial<Record<DcsTahapKey, DcsTahapStat>>;
};

export type DcsSekolah = {
  kod: string;
  nama: string;
  pkg: string;
  kelasSiap: number;
  kelasJumlah: number;
  muridSiap: number;
  muridJumlah: number;
  /** Skor purata sekolah (skala sumber); null = tiada dalam senarai Top Schools. */
  skorT6: number | null;
  skorT3: number | null;
  skorT5: number | null;
};

export type DcsSnapshot = {
  tahun: number;
  capturedOn: string;
  sumber: string;
  jumlahPkgPerak: number;
  pkg: DcsPkg[];
  sekolah: DcsSekolah[];
};

/** Semakan konsisten: jumlah murid sekolah = angka PKG (halaman Ranking). */
export function semakDcs(s: DcsSnapshot): string[] {
  const ralat: string[] = [];
  for (const p of s.pkg) {
    const sek = s.sekolah.filter((x) => x.pkg === p.pkg);
    const siap = sek.reduce((a, x) => a + x.muridSiap, 0);
    const jumlah = sek.reduce((a, x) => a + x.muridJumlah, 0);
    if (sek.length !== p.sekolahJumlah) ralat.push(`${p.pkg}: ${sek.length} sekolah ≠ ${p.sekolahJumlah}`);
    if (siap !== p.muridSiap || jumlah !== p.muridJumlah)
      ralat.push(`${p.pkg}: murid ${siap}/${jumlah} ≠ ${p.muridSiap}/${p.muridJumlah}`);
  }
  return ralat;
}
