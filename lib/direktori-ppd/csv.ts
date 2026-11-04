import { namaKunci } from "@/lib/mjkd/nama-kunci";
import { pecahCsv } from "@/lib/mjkd/pegawai-csv";

export type DirektoriPpdBaris = {
  namaKunci: string;
  nama: string;
  gred: string;
  jawatan: string;
  telefon: string;
};

const HEADER = ["bil", "nama pegawai", "gred sspa (penyandang)", "jawatan", "no tel"];

const rapi = (v: string | undefined) => (v ?? "").trim().replace(/\s+/g, " ");

/**
 * Baca CSV eksport helaian "senarai pegawai PPD". Baris pengepala dicari (baris pertama
 * yang bermula `BIL`); baris tanpa nama atau bertanda KOSONG (jawatan belum diisi) dilangkau.
 * Nama berganda digabung — baris terakhir menang. Susunan = susunan baris dalam helaian.
 */
export function parseDirektoriPpdCsv(teks: string): DirektoriPpdBaris[] {
  const rows = pecahCsv(teks.replace(/^﻿/, ""));
  const idx = rows.findIndex((r) => rapi(r[0]).toLowerCase() === "bil");
  if (idx < 0) throw new Error("Pengepala 'BIL' tidak dijumpai dalam CSV.");
  const header = rows[idx]!.map((h) => rapi(h).toLowerCase());
  if (HEADER.some((h, i) => header[i] !== h)) {
    throw new Error(`Pengepala CSV mesti bermula: ${HEADER.join(",")}`);
  }
  const mengikutKunci = new Map<string, DirektoriPpdBaris>();
  for (const r of rows.slice(idx + 1)) {
    const nama = rapi(r[1]);
    if (!nama || nama.toUpperCase() === "KOSONG") continue;
    const kunci = namaKunci(nama);
    mengikutKunci.delete(kunci);
    mengikutKunci.set(kunci, {
      namaKunci: kunci,
      nama,
      gred: rapi(r[2]),
      jawatan: rapi(r[3]),
      telefon: rapi(r[4]),
    });
  }
  return [...mengikutKunci.values()];
}
