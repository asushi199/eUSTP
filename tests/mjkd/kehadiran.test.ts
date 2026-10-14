import assert from "node:assert/strict";
import test from "node:test";
import { csvKehadiranMjkd } from "../../lib/mjkd/csv";
import {
  escapeLike,
  kiraKehadiran,
  kodSekolahHadir,
  sahkanTeksKehadiran,
} from "../../lib/mjkd/kehadiran";
import { namaKunci } from "../../lib/mjkd/nama-kunci";

test("sahkanTeksKehadiran: trim, ruang berganda, wajib isi", () => {
  const r = sahkanTeksKehadiran(
    { nama: "  Ali   bin Abu ", jawatan: " Guru  Besar " },
    { perluOrganisasi: false },
  );
  assert.deepEqual(r, { ok: true, nama: "Ali bin Abu", jawatan: "Guru Besar", organisasi: null });
  assert.equal(sahkanTeksKehadiran({ nama: "  ", jawatan: "X" }, { perluOrganisasi: false }).ok, false);
  assert.equal(sahkanTeksKehadiran({ nama: "A", jawatan: "" }, { perluOrganisasi: false }).ok, false);
});

test("sahkanTeksKehadiran: organisasi wajib bila diminta dan dihadkan panjangnya", () => {
  assert.equal(
    sahkanTeksKehadiran({ nama: "A", jawatan: "B", organisasi: " " }, { perluOrganisasi: true }).ok,
    false,
  );
  const ok = sahkanTeksKehadiran(
    { nama: "A", jawatan: "B", organisasi: " JPN  Perak " },
    { perluOrganisasi: true },
  );
  assert.equal(ok.ok && ok.organisasi, "JPN Perak");
  assert.equal(
    sahkanTeksKehadiran(
      { nama: "x".repeat(201), jawatan: "B", organisasi: "C" },
      { perluOrganisasi: true },
    ).ok,
    false,
  );
  assert.equal(sahkanTeksKehadiran(null, { perluOrganisasi: false }).ok, false);
});

test("kunci duplikasi: nama sama selepas normalisasi", () => {
  assert.equal(namaKunci(" ali  bin ABU"), namaKunci("ALI BIN abu"));
});

test("sekolah hadir = ada rekod PGB atau WAKIL bagi kod; pegawai/lain tidak dikira", () => {
  const rekod = [
    { jenis: "PGB", schoolCode: "A1" },
    { jenis: "WAKIL", schoolCode: "B2" },
    { jenis: "WAKIL", schoolCode: "B2" },
    { jenis: "PEGAWAI", schoolCode: null },
    { jenis: "LAIN", schoolCode: null },
    { jenis: "PEGAWAI", schoolCode: "C3" },
  ];
  assert.deepEqual([...kodSekolahHadir(rekod)].sort(), ["A1", "B2"]);
  const k = kiraKehadiran(rekod, ["A1", "B2", "C3", "D4"]);
  assert.equal(k.sekolahHadir, 2);
  assert.equal(k.sekolahJumlah, 4);
  assert.equal(k.pgb, 1);
  assert.equal(k.wakil, 2);
  assert.equal(k.pegawai, 2);
  assert.equal(k.lain, 1);
  assert.equal(k.jumlah, 6);
});

test("kiraKehadiran: kod di luar senarai sekolah dijangka tidak dikira", () => {
  const k = kiraKehadiran([{ jenis: "PGB", schoolCode: "ZZ" }], ["A1"]);
  assert.equal(k.sekolahHadir, 0);
});

test("escapeLike melepaskan % _ dan \\", () => {
  assert.equal(escapeLike("a%b_c\\d"), "a\\%b\\_c\\\\d");
  assert.equal(escapeLike("ali"), "ali");
});

test("CSV kehadiran: header, BOM dan halang formula", () => {
  const csv = csvKehadiranMjkd([
    {
      tarikh: "2026-02-27",
      masa: "08:30:00",
      nama: "=SUM(A1)",
      jawatan: "Guru Besar",
      organisasi: "SK DENDANG",
      jenis: "PGB",
      kodSekolah: "ABA1001",
    },
  ]);
  assert.ok(csv.startsWith("﻿Tarikh,Masa,Nama,Jawatan,Organisasi,Jenis,Kod sekolah\r\n"));
  assert.ok(csv.includes("'=SUM(A1)"));
});
