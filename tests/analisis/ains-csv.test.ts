import assert from "node:assert/strict";
import test from "node:test";
import {
  ainsCsvCell,
  csvMuridSatuBulan,
  csvMuridSemuaBulan,
  namaFailAins,
  tapisMuridCsv,
} from "../../lib/analisis/ains-csv";
import type { AinsMuridBulan, AinsMuridRow } from "../../lib/analisis/ains-types";

const bln = (bulan: number, lulus: number, ditolak = 0): AinsMuridBulan => ({
  bulan,
  lulus,
  ditolak,
  eng: 1,
  bm: lulus,
  lain: 0,
  mukaSurat: lulus * 10,
  star: 2,
});

const murid: AinsMuridRow[] = [
  { id: 1, nama: "ALI BIN ABU", b: [bln(1, 3), bln(2, 0, 1), bln(3, 5)] },
  { id: 2, nama: 'SITI "COMEL", NUR', b: [bln(2, 4)] },
  { id: 3, nama: "=CMD()", b: [] },
];

test("ainsCsvCell: petik, escape petikan dan halang formula", () => {
  assert.equal(ainsCsvCell("abc"), "abc");
  assert.equal(ainsCsvCell('a,"b"'), '"a,""b"""');
  assert.equal(ainsCsvCell("=1+1"), "'=1+1");
  assert.equal(ainsCsvCell("-5 nama"), "'-5 nama");
  assert.equal(ainsCsvCell(7), "7");
});

test("csvMuridSatuBulan: BOM, status dan angka bulan dipilih", () => {
  const csv = csvMuridSatuBulan(murid, 2);
  assert.ok(csv.startsWith("﻿Nama murid,Status,"));
  const lines = csv.trim().split("\r\n");
  assert.equal(lines.length, 4);
  assert.equal(
    lines[0].replace("﻿", ""),
    "Nama murid,Status,Diluluskan,Terkumpul Jan-Feb,Ditolak,BM,BI,Lain-lain,Muka surat,Bintang",
  );
  // Ali: Jan 3 + Feb 0 → terkumpul 3 (Mac tidak dikira)
  assert.equal(lines[1], "ALI BIN ABU,Belum membaca,0,3,1,0,1,0,0,2");
  assert.equal(lines[2], '"SITI ""COMEL"", NUR",Sudah membaca,4,4,0,4,1,0,40,2');
  assert.equal(lines[3], "'=CMD(),Belum membaca,0,0,0,0,0,0,0,0");
});

test("csvMuridSemuaBulan: lajur ikut bulan ada data, jumlah betul", () => {
  const csv = csvMuridSemuaBulan(murid);
  const lines = csv.trim().split("\r\n");
  assert.equal(
    lines[0].replace("﻿", ""),
    "Nama murid,Jan Diluluskan,Jan Ditolak,Feb Diluluskan,Feb Ditolak,Mac Diluluskan,Mac Ditolak," +
      "Jumlah Diluluskan,Jumlah Ditolak,Jumlah BM,Jumlah BI,Jumlah Lain-lain,Jumlah Muka surat," +
      "Jumlah Bintang,Bulan membaca",
  );
  // Ali: Jan 3/0, Feb 0/1, Mac 5/0 → jumlah 8 lulus, 1 ditolak, 2 bulan membaca
  assert.equal(lines[1], "ALI BIN ABU,3,0,0,1,5,0,8,1,8,3,0,80,6,2");
  // Siti hanya ada Feb; bulan lain 0
  assert.equal(lines[2], '"SITI ""COMEL"", NUR",0,0,4,0,0,0,4,0,4,1,0,40,2,1');
  assert.equal(lines.length, 4);
});

test("namaFailAins: slug selamat, buang bahagian kosong", () => {
  assert.equal(
    namaFailAins(["ABA1234", 2026, "Semua Bulan", null, false]),
    "ains-aba1234-2026-semua-bulan.csv",
  );
  assert.equal(namaFailAins(["X", "", "belum"]), "ains-x-belum.csv");
});

test("tapisMuridCsv: 'sudah' ikut bulan vs mana-mana bulan", () => {
  const nama = (r: AinsMuridRow[]) => r.map((m) => m.nama);
  // Feb: hanya Siti membaca; Ali (Feb 0) tidak.
  assert.deepEqual(nama(tapisMuridCsv(murid, { q: "", status: "baca", sort: "nama", bulan: 2 })), [
    'SITI "COMEL", NUR',
  ]);
  // Mana-mana bulan: Ali (Jan & Mac) dan Siti; murid tanpa bacaan tidak.
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "baca", sort: "nama", bulan: null })),
    ["ALI BIN ABU", 'SITI "COMEL", NUR'],
  );
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "belum", sort: "nama", bulan: null })),
    ["=CMD()"],
  );
  // Susun ikut jumlah semua bulan (Ali 8 > Siti 4); carian dihormati.
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "baca", sort: "lulus-desc", bulan: null })),
    ["ALI BIN ABU", 'SITI "COMEL", NUR'],
  );
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "siti", status: "", sort: "nama", bulan: null })),
    ['SITI "COMEL", NUR'],
  );
  // Tidak mengubah tatasusunan asal.
  assert.equal(murid[0].nama, "ALI BIN ABU");
});

test("tapisMuridCsv: susun ikut jumlah terkumpul hingga bulan terpilih", () => {
  const nama = (r: AinsMuridRow[]) => r.map((m) => m.nama);
  // Hingga Feb: Ali 3 (Mac tidak dikira), Siti 4, =CMD() 0.
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "", sort: "jumlah-desc", bulan: 2 })),
    ['SITI "COMEL", NUR', "ALI BIN ABU", "=CMD()"],
  );
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "", sort: "jumlah-asc", bulan: 2 })),
    ["=CMD()", "ALI BIN ABU", 'SITI "COMEL", NUR'],
  );
  // Hingga Mac: Ali 8 > Siti 4.
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "", sort: "jumlah-desc", bulan: 3 })),
    ["ALI BIN ABU", 'SITI "COMEL", NUR', "=CMD()"],
  );
});

test("tapisMuridCsv: 'kosong' = tiada bacaan dari Januari hingga bulan terpilih", () => {
  const nama = (r: AinsMuridRow[]) => r.map((m) => m.nama);
  // Hingga Jan: Siti (mula Feb) dan =CMD() belum ada bacaan; Ali ada.
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "kosong", sort: "nama", bulan: 1 })),
    ["=CMD()", 'SITI "COMEL", NUR'],
  );
  // Hingga Feb: Siti sudah ada → hanya =CMD(). Ali (Feb 0 tetapi Jan 3) bukan kosong.
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "kosong", sort: "nama", bulan: 2 })),
    ["=CMD()"],
  );
  assert.deepEqual(
    nama(tapisMuridCsv(murid, { q: "", status: "kosong", sort: "nama", bulan: null })),
    ["=CMD()"],
  );
});
