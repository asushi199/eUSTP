/**
 * Penjana CSV maklum balas MJKD (tulen). BOM UTF-8 supaya Excel membaca dengan betul;
 * sel yang bermula `= + - @` diawali `'` (halang formula) — sama seperti CSV Program Ains.
 */
import { ainsCsvCell } from "../analisis/ains-csv";
import { STATUS_MJKD_LABEL, isStatusMjkd } from "./enums";
import { urlBukaFotoBukti } from "./validation";

export type CsvMaklumBalasBaris = {
  kodSekolah: string;
  namaSekolah: string;
  jenis: string;
  zon: string;
  para: string;
  mukaSurat: string;
  perkara: string;
  status: string;
  catatan: string;
  pautanBukti: string;
  /** Path Drive gambar bukti (pilihan). */
  fotoBukti?: string[];
  namaPengisi: string;
  jawatanPengisi: string;
  tarikhHantar: string;
  dipilih: boolean;
  susunanBacaan: number | null;
};

export function csvMaklumBalasMjkd(baris: readonly CsvMaklumBalasBaris[]): string {
  const rows: (string | number)[][] = [
    [
      "Kod sekolah",
      "Nama sekolah",
      "Jenis",
      "Zon (PKG)",
      "Para",
      "Muka surat",
      "Perkara",
      "Status",
      "Catatan",
      "Pautan bukti",
      "Gambar bukti",
      "Nama pengisi",
      "Jawatan pengisi",
      "Tarikh hantar",
      "Dipilih untuk dibaca",
      "Susunan bacaan",
    ],
  ];
  for (const b of baris) {
    rows.push([
      b.kodSekolah,
      b.namaSekolah,
      b.jenis,
      b.zon,
      b.para,
      b.mukaSurat,
      b.perkara,
      isStatusMjkd(b.status) ? STATUS_MJKD_LABEL[b.status] : b.status,
      b.catatan,
      b.pautanBukti,
      (b.fotoBukti ?? []).map(urlBukaFotoBukti).join(" "),
      b.namaPengisi,
      b.jawatanPengisi,
      b.tarikhHantar,
      b.dipilih ? "Ya" : "Tidak",
      b.susunanBacaan ?? "",
    ]);
  }
  return `﻿${rows.map((r) => r.map(ainsCsvCell).join(",")).join("\r\n")}\r\n`;
}

export type CsvKehadiranBaris = {
  tarikh: string;
  masa: string;
  nama: string;
  jawatan: string;
  organisasi: string;
  jenis: string;
  kodSekolah: string;
};

/** CSV kehadiran: Tarikh, Masa, Nama, Jawatan, Organisasi, Jenis, Kod sekolah. */
export function csvKehadiranMjkd(baris: readonly CsvKehadiranBaris[]): string {
  const rows: (string | number)[][] = [
    ["Tarikh", "Masa", "Nama", "Jawatan", "Organisasi", "Jenis", "Kod sekolah"],
  ];
  for (const b of baris) {
    rows.push([b.tarikh, b.masa, b.nama, b.jawatan, b.organisasi, b.jenis, b.kodSekolah]);
  }
  return `﻿${rows.map((r) => r.map(ainsCsvCell).join(",")).join("\r\n")}\r\n`;
}
