/**
 * Penghuraian CSV Program Ains (tulen, tanpa I/O) — hanya PPD Manjung.
 * Dua fail sebulan: ringkasan sekolah (`school_*.csv`) dan senarai pengguna/murid (`user_*.csv`).
 */
import { parseCsv } from "./delima-csv-parse";

export const AINS_DAERAH = "MANJUNG";

export type AinsSekolahSumber = {
  kod: string;
  nama: string;
  murid: number;
  ditolak: number;
  lulus: number;
  purata: number;
};

export type AinsMuridBulan = {
  email: string;
  nama: string;
  kod: string;
  namaSekolah: string;
  jenis: string;
  tahap: string;
  ditolak: number;
  lulus: number;
  eng: number;
  bm: number;
  lain: number;
  mukaSurat: number;
  star: number;
};

const nombor = (s: string | undefined) => Number((s ?? "").replace(/,/g, "").trim()) || 0;

function lajur(head: string[]) {
  const idx = new Map(head.map((h, i) => [h.trim().toLowerCase(), i]));
  return (nama: string) => idx.get(nama) ?? -1;
}

function adaManjung(daerah: string | undefined): boolean {
  return (daerah ?? "").toUpperCase().includes(AINS_DAERAH);
}

/** Fail ringkasan sekolah: DAERAH, KOD SEKOLAH, NAMA SEKOLAH, JUMLAH MURID, BACAAN DITOLAK, BACAAN LULUS, PURATA BACAAN. */
export function parseAinsSekolah(csv: string): AinsSekolahSumber[] {
  const [head, ...isi] = parseCsv(csv.replace(/^﻿/, ""));
  if (!head) return [];
  const col = lajur(head);
  const [iD, iKod, iNama, iMurid, iTolak, iLulus, iPurata] = [
    "daerah",
    "kod sekolah",
    "nama sekolah",
    "jumlah murid",
    "bacaan ditolak",
    "bacaan lulus",
    "purata bacaan",
  ].map(col);
  if ([iD, iKod, iNama, iMurid, iTolak, iLulus, iPurata].some((i) => i < 0)) {
    throw new Error("Lajur fail sekolah Ains tidak dikenali.");
  }
  const out: AinsSekolahSumber[] = [];
  for (const r of isi) {
    if (!adaManjung(r[iD])) continue;
    const kod = r[iKod]?.trim().toUpperCase();
    if (!kod) continue;
    out.push({
      kod,
      nama: r[iNama]?.trim() ?? kod,
      murid: nombor(r[iMurid]),
      ditolak: nombor(r[iTolak]),
      lulus: nombor(r[iLulus]),
      purata: nombor(r[iPurata]),
    });
  }
  return out;
}

/** Fail pengguna: satu baris satu murid; hanya baris `district` Manjung. */
export function parseAinsMurid(csv: string): AinsMuridBulan[] {
  const [head, ...isi] = parseCsv(csv.replace(/^﻿/, ""));
  if (!head) return [];
  const col = lajur(head);
  const need = [
    "district",
    "code",
    "school",
    "school level",
    "school type",
    "name",
    "email",
    "rejected",
    "approved",
    "total eng",
    "total bm",
    "total others",
    "book eng no of pages",
    "book bm no of pages",
    "book others no of pages",
    "star",
  ];
  const i = Object.fromEntries(need.map((n) => [n, col(n)]));
  if (need.some((n) => i[n] < 0)) throw new Error("Lajur fail pengguna Ains tidak dikenali.");
  const out: AinsMuridBulan[] = [];
  for (const r of isi) {
    if (!adaManjung(r[i["district"]])) continue;
    const email = r[i["email"]]?.trim().toLowerCase();
    const kod = r[i["code"]]?.trim().toUpperCase();
    if (!email || !kod) continue;
    out.push({
      email,
      nama: r[i["name"]]?.trim() ?? "",
      kod,
      namaSekolah: r[i["school"]]?.trim() ?? "",
      jenis: r[i["school type"]]?.trim().toUpperCase() ?? "",
      tahap: r[i["school level"]]?.trim() ?? "",
      ditolak: nombor(r[i["rejected"]]),
      lulus: nombor(r[i["approved"]]),
      eng: nombor(r[i["total eng"]]),
      bm: nombor(r[i["total bm"]]),
      lain: nombor(r[i["total others"]]),
      mukaSurat:
        nombor(r[i["book eng no of pages"]]) +
        nombor(r[i["book bm no of pages"]]) +
        nombor(r[i["book others no of pages"]]),
      star: nombor(r[i["star"]]),
    });
  }
  return out;
}

export type AinsSekolahBulan = AinsSekolahSumber & {
  jenis: string;
  tahap: string;
  muridMembaca: number;
  eng: number;
  bm: number;
  lain: number;
  mukaSurat: number;
  star: number;
};

/** Gabung ringkasan sekolah (fail sekolah) dengan jumlah daripada fail pengguna. */
export function gabungSekolahBulan(
  sekolah: AinsSekolahSumber[],
  murid: AinsMuridBulan[],
): AinsSekolahBulan[] {
  const agg = new Map<string, Omit<AinsSekolahBulan, keyof AinsSekolahSumber> & { nama: string }>();
  for (const m of murid) {
    const a = agg.get(m.kod) ?? {
      nama: m.namaSekolah,
      jenis: m.jenis,
      tahap: m.tahap,
      muridMembaca: 0,
      eng: 0,
      bm: 0,
      lain: 0,
      mukaSurat: 0,
      star: 0,
    };
    if (m.lulus > 0) a.muridMembaca++;
    a.eng += m.eng;
    a.bm += m.bm;
    a.lain += m.lain;
    a.mukaSurat += m.mukaSurat;
    a.star += m.star;
    agg.set(m.kod, a);
  }
  const hasil: AinsSekolahBulan[] = sekolah.map((s) => {
    const a = agg.get(s.kod);
    return {
      ...s,
      jenis: a?.jenis ?? "",
      tahap: a?.tahap ?? "",
      muridMembaca: a?.muridMembaca ?? 0,
      eng: a?.eng ?? 0,
      bm: a?.bm ?? 0,
      lain: a?.lain ?? 0,
      mukaSurat: a?.mukaSurat ?? 0,
      star: a?.star ?? 0,
    };
  });
  // Sekolah yang hanya ada dalam fail pengguna (tiada baris dalam fail sekolah).
  const ada = new Set(sekolah.map((s) => s.kod));
  for (const [kod, a] of agg) {
    if (ada.has(kod)) continue;
    hasil.push({
      kod,
      nama: a.nama,
      murid: 0,
      ditolak: 0,
      lulus: 0,
      purata: 0,
      jenis: a.jenis,
      tahap: a.tahap,
      muridMembaca: a.muridMembaca,
      eng: a.eng,
      bm: a.bm,
      lain: a.lain,
      mukaSurat: a.mukaSurat,
      star: a.star,
    });
  }
  return hasil.sort((x, y) => x.kod.localeCompare(y.kod));
}

const BULAN_NAMA: [RegExp, number][] = [
  [/\bjan/i, 1],
  [/\bfeb/i, 2],
  [/\b(mar|mac)/i, 3],
  [/\bapr/i, 4],
  [/\b(mei|may)\b/i, 5],
  [/\bjun/i, 6],
  [/\bjul/i, 7],
  [/\b(ogo|aug)/i, 8],
  [/\bsep/i, 9],
  [/\b(okt|oct)/i, 10],
  [/\bnov/i, 11],
  [/\b(dis|dec)/i, 12],
];

/** Teka nombor bulan (1–12) daripada nama fail, cth. "user_PERAK_jun.csv" → 6. */
export function bulanDariNamaFail(nama: string): number | null {
  const bersih = nama.replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " ");
  for (const [re, n] of BULAN_NAMA) if (re.test(bersih)) return n;
  return null;
}
