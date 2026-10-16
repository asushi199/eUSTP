/**
 * Data DELIMa 3.0 daripada papan pemuka rasmi KPM (d3.delima.edu.my → Utama), diambil secara
 * manual setiap bulan oleh pegawai yang log masuk (API sumber perlukan sesi pengguna, jadi
 * pelayan tidak boleh tarik sendiri). Fail CSV ringkasan sekolah sahaja — tiada data individu.
 *
 * Format (`scripts/data/delima-d3-YYYY-MM-DD.csv`):
 *   sekolah,guru_aktif,guru_jumlah,murid_aktif,murid_jumlah
 *   PPD MANJUNG,3699,3757,21724,41501      ← baris pertama = jumlah daerah
 *   SEKOLAH KEBANGSAAN SEGARI,15,15,85,97
 * Nama sekolah berulang dalam d3 (dua unit berlainan) boleh ditanda "[1]"/"[2]"; tanda itu
 * diabaikan dan kod dipadankan ikut jumlah guru/murid paling hampir.
 *
 * Modul tulen (tanpa I/O) supaya boleh diuji dan diimport oleh skrip.
 */
import { parseCsv } from "./delima-csv-parse";

export const DELIMA_D3_SUMBER = "https://d3.delima.edu.my";

export type D3Pop = { aktif: number; jumlah: number; peratus: number };
export type D3Baris = { nama: string; guru: D3Pop; murid: D3Pop };
export type D3Data = { daerah: D3Baris; sekolah: D3Baris[] };

const bulat2 = (n: number) => Math.round(n * 100) / 100;

export function d3Pop(aktif: number, jumlah: number): D3Pop {
  return { aktif, jumlah, peratus: jumlah > 0 ? bulat2((aktif / jumlah) * 100) : 0 };
}

/** Nama untuk padanan: huruf besar, tanpa tanda "[n]", ruang tunggal, tanda baca ringkas. */
export function namaKunci(nama: string): string {
  return nama
    .toUpperCase()
    .replace(/\[\d+\]/g, "")
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseD3Csv(text: string): D3Data {
  const [head, ...isi] = parseCsv(text.replace(/^﻿/, ""));
  if (!head) throw new Error("CSV kosong.");
  const col = (n: string) => head.findIndex((h) => h.trim().toLowerCase() === n);
  const i = {
    nama: col("sekolah"),
    ga: col("guru_aktif"),
    gj: col("guru_jumlah"),
    ma: col("murid_aktif"),
    mj: col("murid_jumlah"),
  };
  if (Object.values(i).some((x) => x < 0)) {
    throw new Error("Lajur wajib: sekolah, guru_aktif, guru_jumlah, murid_aktif, murid_jumlah");
  }
  const int = (s: string | undefined, baris: number) => {
    const n = Number((s ?? "").replace(/,/g, "").trim());
    if (!Number.isInteger(n) || n < 0) throw new Error(`Nombor tidak sah pada baris ${baris}: "${s}"`);
    return n;
  };
  const rows = isi.map((r, k) => {
    const b = k + 2;
    const guru = d3Pop(int(r[i.ga], b), int(r[i.gj], b));
    const murid = d3Pop(int(r[i.ma], b), int(r[i.mj], b));
    if (guru.aktif > guru.jumlah || murid.aktif > murid.jumlah) {
      throw new Error(`Aktif melebihi jumlah pada baris ${b}`);
    }
    return { nama: (r[i.nama] ?? "").trim(), guru, murid };
  });
  const [daerah, ...sekolah] = rows;
  if (!daerah || !/^PPD\b/i.test(daerah.nama)) {
    throw new Error('Baris pertama mesti jumlah daerah (cth. "PPD MANJUNG").');
  }
  if (sekolah.length === 0) throw new Error("Tiada baris sekolah.");
  return { daerah, sekolah };
}

/** Hasil tambah sekolah mesti sama dengan jumlah daerah (semakan salah salin/baca). */
export function semakJumlah(d: D3Data): string[] {
  const sum = (f: (b: D3Baris) => number) => d.sekolah.reduce((a, b) => a + f(b), 0);
  const ralat: string[] = [];
  const banding: [string, number, number][] = [
    ["guru aktif", sum((b) => b.guru.aktif), d.daerah.guru.aktif],
    ["guru jumlah", sum((b) => b.guru.jumlah), d.daerah.guru.jumlah],
    ["murid aktif", sum((b) => b.murid.aktif), d.daerah.murid.aktif],
    ["murid jumlah", sum((b) => b.murid.jumlah), d.daerah.murid.jumlah],
  ];
  for (const [label, s, t] of banding) if (s !== t) ralat.push(`${label}: sekolah ${s} ≠ daerah ${t}`);
  return ralat;
}

export type RujukanSekolah = { kod: string; nama: string; guruJumlah: number | null; muridJumlah: number | null };

/**
 * Padankan nama sekolah d3 → kod sekolah (rujukan = senarai sekolah snapshot terdahulu).
 * Nama berulang: pilih calon dengan beza jumlah guru + murid terkecil; setiap kod dipakai sekali.
 */
export function padankanKod(
  sekolah: D3Baris[],
  rujukan: RujukanSekolah[],
): { padan: (D3Baris & { kod: string })[]; tiada: string[] } {
  const calon = new Map<string, RujukanSekolah[]>();
  for (const r of rujukan) {
    const k = namaKunci(r.nama);
    calon.set(k, [...(calon.get(k) ?? []), r]);
  }
  const beza = (b: D3Baris, r: RujukanSekolah) =>
    Math.abs((r.guruJumlah ?? 0) - b.guru.jumlah) + Math.abs((r.muridJumlah ?? 0) - b.murid.jumlah);
  // Semua pasangan (sekolah, calon) disusun ikut beza terkecil, lalu dikunci secara tamak —
  // pasangan paling jelas dahulu, setiap baris d3 dan setiap kod sekali sahaja.
  const pasangan = sekolah.flatMap((b, idx) =>
    (calon.get(namaKunci(b.nama)) ?? []).map((r) => ({ idx, r, d: beza(b, r) })),
  );
  pasangan.sort((a, b) => a.d - b.d);
  const kodBaris = new Map<number, string>();
  const dipakai = new Set<string>();
  for (const p of pasangan) {
    if (kodBaris.has(p.idx) || dipakai.has(p.r.kod)) continue;
    kodBaris.set(p.idx, p.r.kod);
    dipakai.add(p.r.kod);
  }
  const padan: (D3Baris & { kod: string })[] = [];
  const tiada: string[] = [];
  sekolah.forEach((b, idx) => {
    const kod = kodBaris.get(idx);
    if (kod) padan.push({ ...b, kod });
    else tiada.push(b.nama);
  });
  return { padan, tiada };
}
