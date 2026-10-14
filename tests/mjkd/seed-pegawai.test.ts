import assert from "node:assert/strict";
import test from "node:test";
import { isSasaranMjkd } from "../../lib/mjkd/enums";
import { parsePegawaiPpdCsv } from "../../lib/mjkd/pegawai-csv";
import { perkaraUntukSekolah } from "../../lib/mjkd/sasaran";
import {
  MJKD_2026_BIL1_MESYUARAT,
  MJKD_2026_BIL1_PERKARA,
} from "../../lib/mjkd/seed-2026-bil1";
import { SEKOLAH_MANJUNG } from "./fixtures/schools";

test("seed Bil.1/2026: 13 perkara, sasaran sah, para unik", () => {
  assert.equal(MJKD_2026_BIL1_PERKARA.length, 13);
  assert.equal(new Set(MJKD_2026_BIL1_PERKARA.map((p) => p.para)).size, 13);
  for (const p of MJKD_2026_BIL1_PERKARA) {
    assert.ok(isSasaranMjkd(p.sasaran), p.para);
    assert.ok(p.perkara.length > 0 && p.tindakan.length > 0, p.para);
  }
  assert.equal(MJKD_2026_BIL1_MESYUARAT.tarikh, "2026-02-27");
});

test("seed Bil.1/2026: nama sekolah khusus sepadan tepat satu sekolah sebenar", () => {
  const nama = MJKD_2026_BIL1_PERKARA.flatMap((p) => p.sekolahKhususNama ?? []);
  assert.equal(nama.length, 4);
  for (const n of nama) {
    const padan = SEKOLAH_MANJUNG.filter((s) => s.name.toUpperCase() === n.toUpperCase());
    assert.equal(padan.length, 1, n);
  }
});

test("seed Bil.1/2026: bilangan perkara terpakai mengikut jenis sekolah sebenar", () => {
  const kodMengikutNama = new Map(SEKOLAH_MANJUNG.map((s) => [s.name.toUpperCase(), s.code]));
  const perkara = MJKD_2026_BIL1_PERKARA.map((p) => ({
    ...p,
    sekolahKhusus: (p.sekolahKhususNama ?? []).map((n) => kodMengikutNama.get(n.toUpperCase())!),
  }));
  const untuk = (nama: string) => {
    const s = SEKOLAH_MANJUNG.find((x) => x.name === nama)!;
    return perkaraUntukSekolah(perkara, s).map((p) => p.para);
  };
  // SEMUA: 1.3, 1.4, 1.6, 4.1.3 (iii), 4.1.3 (vii), 7.4, 17.x, 22.1.
  const semua = perkara.filter((p) => p.sasaran === "SEMUA").length;
  assert.equal(semua, 8);
  assert.equal(untuk("SK DENDANG").length, semua);
  assert.equal(untuk("SJKC ENG LING").length, semua + 1); // + 7.3.5 (SJK)
  assert.equal(untuk("SJKT PANGKOR").length, semua + 1);
  assert.equal(untuk("SMK SERI MANJUNG").length, semua + 2); // + 3.3 + 5.5 (SM)
  assert.equal(untuk("SMK RAJA SHAHRIMAN").length, semua + 3); // + 3.3, 5.5, 6.4
  assert.equal(untuk("SMK PANGKALAN TLDM").length, semua + 3);
  assert.equal(untuk("SK SERI SELAMAT").length, semua + 1); // + 7.3.4
  assert.equal(untuk("SK PENGKALAN BAHARU").length, semua + 1);
  // SK biasa tidak menerima 7.3.4 (khusus) — SR sahaja tidak mencukupi.
  assert.ok(!untuk("SK DENDANG").includes("7.3.4"));
  assert.ok(!untuk("SMK AYER TAWAR").includes("6.4"));
});

test("CSV pegawai: header tepat, medan berpetik, nama berganda digabung", () => {
  const csv =
    "﻿nama,jawatan,sektor\r\n" +
    'ALI BIN ABU,"PEGAWAI, KANAN",PERANCANGAN\r\n' +
    "  Siti   Aminah ,TIMBALAN,PEMBELAJARAN\r\n" +
    "ali bin abu,KETUA,PENTADBIRAN\r\n";
  const out = parsePegawaiPpdCsv(csv);
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], { nama: "Siti Aminah", jawatan: "TIMBALAN", sektor: "PEMBELAJARAN" });
  assert.deepEqual(out[1], { nama: "ali bin abu", jawatan: "KETUA", sektor: "PENTADBIRAN" });
});

test("CSV pegawai: tolak header selain nama,jawatan,sektor (termasuk lajur IC)", () => {
  assert.throws(() => parsePegawaiPpdCsv("nama,jawatan,sektor,ic\nA,B,C,D\n"), /Header CSV/);
  assert.throws(() => parsePegawaiPpdCsv("nama,jawatan\nA,B\n"), /Header CSV/);
  assert.throws(() => parsePegawaiPpdCsv(""), /kosong/);
});

test("CSV pegawai: nama kosong ditolak", () => {
  assert.throws(() => parsePegawaiPpdCsv("nama,jawatan,sektor\n,JAWATAN,SEKTOR\n"), /nama kosong/);
});
