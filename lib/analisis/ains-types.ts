/**
 * Jenis + pembantu tulen Program Ains (selamat diimport komponen klien).
 * Nilai setiap bulan = angka dalam fail sumber bulan itu (PPD Manjung sahaja).
 */

export type AinsSekolahRow = {
  bulan: number;
  kod: string;
  nama: string;
  jenis: string;
  tahap: string;
  murid: number;
  ditolak: number;
  lulus: number;
  purata: number;
  muridMembaca: number;
  eng: number;
  bm: number;
  lain: number;
  mukaSurat: number;
  star: number;
};

/** Semua bulan satu tahun (≈100 sekolah × bilangan bulan). */
export type AinsTahunData = {
  tahun: number;
  /** Bulan (1–12) yang ada data, menaik. */
  bulan: number[];
  sekolah: AinsSekolahRow[];
};

export type AinsMuridBulan = {
  bulan: number;
  lulus: number;
  ditolak: number;
  eng: number;
  bm: number;
  lain: number;
  mukaSurat: number;
  star: number;
};

export type AinsMuridRow = {
  id: number;
  nama: string;
  /** Bacaan setiap bulan yang ada, menaik ikut bulan. */
  b: AinsMuridBulan[];
};

export const AINS_BULAN = [
  "Jan",
  "Feb",
  "Mac",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ogs",
  "Sep",
  "Okt",
  "Nov",
  "Dis",
] as const;

export type AinsJumlah = {
  sekolah: number;
  murid: number;
  muridMembaca: number;
  ditolak: number;
  lulus: number;
  eng: number;
  bm: number;
  lain: number;
  mukaSurat: number;
  star: number;
};

export function jumlahAins(rows: AinsSekolahRow[]): AinsJumlah {
  const j: AinsJumlah = {
    sekolah: rows.length,
    murid: 0,
    muridMembaca: 0,
    ditolak: 0,
    lulus: 0,
    eng: 0,
    bm: 0,
    lain: 0,
    mukaSurat: 0,
    star: 0,
  };
  for (const r of rows) {
    j.murid += r.murid;
    j.muridMembaca += r.muridMembaca;
    j.ditolak += r.ditolak;
    j.lulus += r.lulus;
    j.eng += r.eng;
    j.bm += r.bm;
    j.lain += r.lain;
    j.mukaSurat += r.mukaSurat;
    j.star += r.star;
  }
  return j;
}

/** Lulus ikut jenis sekolah (SK, SJKC, SJKT, SMK, …) bagi satu bulan, menurun. */
export function lulusIkutJenis(rows: AinsSekolahRow[]): { label: string; jumlah: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.jenis || "Lain-lain", (m.get(r.jenis || "Lain-lain") ?? 0) + r.lulus);
  return [...m.entries()]
    .map(([label, jumlah]) => ({ label, jumlah }))
    .filter((b) => b.jumlah > 0)
    .sort((a, b) => b.jumlah - a.jumlah);
}

export function bulanTerkini(data: AinsTahunData): number {
  return data.bulan[data.bulan.length - 1] ?? 0;
}
