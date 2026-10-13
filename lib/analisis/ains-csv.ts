/**
 * Penjana CSV senarai murid Program Ains (tulen — selamat diimport komponen klien).
 * Data murid sudah ada di pelayar (dilindungi log masuk MOE-DL), jadi CSV dijana di sisi klien.
 */
import { AINS_BULAN, type AinsMuridBulan, type AinsMuridRow } from "./ains-types";

const namaBulan = (b: number) => AINS_BULAN[b - 1] ?? String(b);

/** Sel CSV: petik jika perlu, dan halang formula Excel (=, +, -, @) daripada dijalankan. */
export function ainsCsvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function keCsv(rows: (string | number)[][]): string {
  // BOM supaya Excel membaca UTF-8 (nama bukan ASCII) dengan betul.
  return `﻿${rows.map((r) => r.map(ainsCsvCell).join(",")).join("\r\n")}\r\n`;
}

const bulanMurid = (m: AinsMuridRow, bulan: number): AinsMuridBulan | null =>
  m.b.find((x) => x.bulan === bulan) ?? null;

/** Satu baris setiap murid untuk satu bulan. */
export function csvMuridSatuBulan(murid: AinsMuridRow[], bulan: number): string {
  const rows: (string | number)[][] = [
    [
      "Nama murid",
      "Status",
      "Diluluskan",
      "Ditolak",
      "BM",
      "BI",
      "Lain-lain",
      "Muka surat",
      "Bintang",
    ],
  ];
  for (const m of murid) {
    const c = bulanMurid(m, bulan);
    rows.push([
      m.nama,
      (c?.lulus ?? 0) > 0 ? "Sudah membaca" : "Belum membaca",
      c?.lulus ?? 0,
      c?.ditolak ?? 0,
      c?.bm ?? 0,
      c?.eng ?? 0,
      c?.lain ?? 0,
      c?.mukaSurat ?? 0,
      c?.star ?? 0,
    ]);
  }
  return keCsv(rows);
}

/**
 * Satu baris setiap murid, semua bulan sebelah-menyebelah: Diluluskan & Ditolak setiap bulan,
 * kemudian jumlah keseluruhan semua bulan.
 */
export function csvMuridSemuaBulan(murid: AinsMuridRow[]): string {
  const bulan = [...new Set(murid.flatMap((m) => m.b.map((x) => x.bulan)))].sort((a, b) => a - b);
  const header: string[] = ["Nama murid"];
  for (const b of bulan) header.push(`${namaBulan(b)} Diluluskan`, `${namaBulan(b)} Ditolak`);
  header.push(
    "Jumlah Diluluskan",
    "Jumlah Ditolak",
    "Jumlah BM",
    "Jumlah BI",
    "Jumlah Lain-lain",
    "Jumlah Muka surat",
    "Jumlah Bintang",
    "Bulan membaca",
  );
  const rows: (string | number)[][] = [header];
  for (const m of murid) {
    const row: (string | number)[] = [m.nama];
    for (const b of bulan) {
      const c = bulanMurid(m, b);
      row.push(c?.lulus ?? 0, c?.ditolak ?? 0);
    }
    const jum = (k: keyof AinsMuridBulan) => m.b.reduce((n, x) => n + x[k], 0);
    row.push(
      jum("lulus"),
      jum("ditolak"),
      jum("bm"),
      jum("eng"),
      jum("lain"),
      jum("mukaSurat"),
      jum("star"),
      m.b.filter((x) => x.lulus > 0).length,
    );
    rows.push(row);
  }
  return keCsv(rows);
}

/** Nama fail selamat: ains-<kod>-<tahun>-<bulan|semua-bulan>[-penapis].csv */
export function namaFailAins(parts: (string | number | null | undefined | false)[]): string {
  const slug = (p: string | number) =>
    String(p)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `${["ains", ...parts]
    .filter((p) => p !== null && p !== undefined && p !== false && p !== "")
    .map((p) => slug(p as string | number))
    .join("-")}.csv`;
}
