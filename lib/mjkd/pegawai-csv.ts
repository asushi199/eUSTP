import { namaKunci } from "./nama-kunci";

export type PegawaiPpdCsvBaris = { nama: string; jawatan: string; sektor: string };

const HEADER = ["nama", "jawatan", "sektor"];

/** Pecah teks CSV (medan berpetik, "" = petikan, CRLF/LF) kepada baris-baris medan. */
function pecahCsv(teks: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let medan = "";
  let dalamPetik = false;
  for (let i = 0; i < teks.length; i += 1) {
    const c = teks[i]!;
    if (dalamPetik) {
      if (c === '"') {
        if (teks[i + 1] === '"') {
          medan += '"';
          i += 1;
        } else {
          dalamPetik = false;
        }
      } else {
        medan += c;
      }
    } else if (c === '"') {
      dalamPetik = true;
    } else if (c === ",") {
      row.push(medan);
      medan = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && teks[i + 1] === "\n") i += 1;
      row.push(medan);
      medan = "";
      rows.push(row);
      row = [];
    } else {
      medan += c;
    }
  }
  if (medan !== "" || row.length > 0) {
    row.push(medan);
    rows.push(row);
  }
  return rows.filter((r) => r.some((m) => m.trim() !== ""));
}

/**
 * Baca CSV pegawai PPD. Header MESTI tepat `nama,jawatan,sektor` — lajur lain
 * (cth. IC / nama pengguna) ditolak supaya data sensitif tidak terimport tanpa sengaja.
 * Nama berganda (selepas normalisasi) digabung — baris terakhir menang.
 */
export function parsePegawaiPpdCsv(teks: string): PegawaiPpdCsvBaris[] {
  const bersih = teks.replace(/^﻿/, "");
  const rows = pecahCsv(bersih);
  if (rows.length === 0) throw new Error("CSV kosong.");
  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  if (header.length !== HEADER.length || header.some((h, i) => h !== HEADER[i])) {
    throw new Error(`Header CSV mesti tepat: ${HEADER.join(",")}`);
  }
  const mengikutKunci = new Map<string, PegawaiPpdCsvBaris>();
  rows.slice(1).forEach((r, i) => {
    if (r.length > HEADER.length) {
      throw new Error(`Baris ${i + 2}: terlalu banyak lajur.`);
    }
    const nama = (r[0] ?? "").trim().replace(/\s+/g, " ");
    if (!nama) throw new Error(`Baris ${i + 2}: nama kosong.`);
    const kunci = namaKunci(nama);
    // Padam dahulu supaya kedudukan (susunan) mengikut kemunculan terakhir.
    mengikutKunci.delete(kunci);
    mengikutKunci.set(kunci, {
      nama,
      jawatan: (r[1] ?? "").trim().replace(/\s+/g, " "),
      sektor: (r[2] ?? "").trim(),
    });
  });
  return [...mengikutKunci.values()];
}
