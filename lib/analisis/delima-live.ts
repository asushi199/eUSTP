import { gabungSekolah } from "./delima-merge";

/**
 * Jenis data DELIMa semasa (ringkasan daerah + senarai sekolah). Sumber tunggal kini snapshot
 * d3.delima.edu.my (rasmi KPM) yang diimport manual setiap bulan — lihat `delima-d3-parse.ts`
 * dan `getDelimaTerkini` (delima-snapshot.ts). Papan pemuka DELIMa Perak tidak lagi dibaca.
 */

/** Daerah lalai bagi penapis eksport (cth. senarai Guru Belum Log Masuk). */
export const DELIMA_DAERAH = "manjung";

export type DelimaLivePop = { aktif: number; jumlah: number; peratus: number };

export type DelimaLive = {
  daerah: string;
  guru: DelimaLivePop;
  murid: DelimaLivePop;
  bilSekolah: number | null;
  /** Tempoh data, cth. "1 Jan – 16 Okt 2026". */
  tempoh: string;
  sumberUrl: string;
};

export type DelimaTahap = "Tinggi" | "Sederhana" | "Rendah";

export type DelimaSchoolPop = DelimaLivePop & { tahap: DelimaTahap };

export type DelimaSchoolRow = {
  kod: string;
  nama: string;
  guru: DelimaSchoolPop | null;
  murid: DelimaSchoolPop | null;
  /** DELIMa 3.0 lama (CSV Google Sheet) — hanya pada snapshot sejarah; undefined jika tiada. */
  guru30?: DelimaLivePop | null;
  murid30?: DelimaLivePop | null;
};

export type DelimaSchoolList = {
  schools: DelimaSchoolRow[];
  tempoh: string;
  daerah: string;
};

export type DelimaSchoolDetail = {
  school: DelimaSchoolRow;
  tempoh: string;
  sumberUrl: string;
  /** Guru belum log masuk (nama sahaja); undefined/null jika senarai belum dimuat naik. */
  belumLogin?: { nama: string[]; tarikh: string } | null;
};

/**
 * Bilangan sekolah yang peratus aktifnya ≥ sasaran KPI. null jika tiada senarai atau sasaran.
 */
export function bilSekolahCapai(
  senarai: DelimaSchoolList | null | undefined,
  populasi: "guru" | "murid",
  sasaran: number | null | undefined,
): number | null {
  if (!senarai || senarai.schools.length === 0 || sasaran == null || !Number.isFinite(sasaran) || sasaran <= 0)
    return null;
  return senarai.schools.filter((r) => (r[populasi]?.peratus ?? -1) >= sasaran).length;
}

/** Bilangan sekolah ikut tahap aktif bagi carta taburan (guru dan murid). */
export function delimaTaburan(
  list: DelimaSchoolList | null | undefined,
): { title: string; seriesName: string; data: { label: string; jumlah: number }[] }[] {
  if (!list || list.schools.length === 0) return [];
  const tahap: [DelimaTahap, string][] = [
    ["Tinggi", "Tinggi (≥75%)"],
    ["Sederhana", "Sederhana (40–74%)"],
    ["Rendah", "Rendah (<40%)"],
  ];
  const sekolah = list.schools.map(gabungSekolah);
  return (["guru", "murid"] as const).map((k) => ({
    title: `Taburan Sekolah · ${k === "guru" ? "Guru" : "Murid"} Aktif`,
    seriesName: "Sekolah",
    data: tahap.map(([t, label]) => ({
      label,
      jumlah: sekolah.filter((s) => s[k]?.tahap === t).length,
    })),
  }));
}
