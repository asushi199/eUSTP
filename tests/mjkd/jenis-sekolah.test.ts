import assert from "node:assert/strict";
import test from "node:test";
import { jawatanPgb } from "../../lib/mjkd/jawatan-pgb";
import {
  jenisSekolah,
  kenalJenisSekolah,
  labelJenisSekolah,
  peringkat,
  type JenisSekolah,
} from "../../lib/mjkd/jenis-sekolah";
import { SEKOLAH_MANJUNG } from "./fixtures/schools";

test("data sebenar: setiap sekolah dikenali dan kiraan mengikut jenis betul", () => {
  const kira: Record<JenisSekolah, number> = { SK: 0, SJKC: 0, SJKT: 0, SM: 0 };
  for (const s of SEKOLAH_MANJUNG) {
    kira[jenisSekolah(s.name, s.code)] += 1;
  }
  assert.equal(SEKOLAH_MANJUNG.length, 102);
  assert.deepEqual(kira, { SK: 42, SJKC: 24, SJKT: 15, SM: 21 });
});

test("data sebenar: peringkat SR = 81, SM = 21", () => {
  let sr = 0;
  let sm = 0;
  for (const s of SEKOLAH_MANJUNG) {
    if (peringkat(jenisSekolah(s.name, s.code)) === "SR") sr += 1;
    else sm += 1;
  }
  assert.equal(sr, 81);
  assert.equal(sm, 21);
});

test("nama dan kod memberi jenis yang sama untuk semua sekolah sebenar", () => {
  for (const s of SEKOLAH_MANJUNG) {
    // Kod sahaja (nama kosong) mesti sama dengan nama sahaja (kod tidak dikenali).
    assert.equal(jenisSekolah("", s.code), jenisSekolah(s.name, "XXX0000"));
  }
});

test("corak nama: SJK(C) / SJK (T) dan huruf kecil dikenali", () => {
  assert.equal(jenisSekolah("SJK(C) Yuk Choy", "ZZZ1"), "SJKC");
  assert.equal(jenisSekolah("SJK (T) Ladang X", "ZZZ2"), "SJKT");
  assert.equal(jenisSekolah("sjkc hwa lian", "ZZZ3"), "SJKC");
  assert.equal(jenisSekolah("  SK   Seri   Selamat ", "ZZZ4"), "SK");
  assert.equal(jenisSekolah("SMK Raja Shahriman", "ZZZ5"), "SM");
  assert.equal(jenisSekolah("SABK Maahad", "ZZZ6"), "SM");
  assert.equal(jenisSekolah("Kolej Vokasional Seri Manjung", "ZZZ7"), "SM");
});

test("nama tidak dikenali -> guna kod; kedua-duanya tidak dikenali -> ralat", () => {
  assert.equal(jenisSekolah("Sekolah Misteri", "ABC9999"), "SJKC");
  assert.throws(() => jenisSekolah("Sekolah Misteri", "ZZZ9999"), /tidak dikenali/);
  assert.equal(kenalJenisSekolah("Sekolah Misteri", "ZZZ9999"), null);
});

test("nama dan kod bercanggah -> ralat (bukan lalai senyap)", () => {
  assert.throws(() => jenisSekolah("SK Contoh", "AEA1234"), /bercanggah/);
  assert.equal(kenalJenisSekolah("SK Contoh", "AEA1234"), null);
});

test("SKM/SKIM bukan SK", () => {
  assert.equal(kenalJenisSekolah("SKIM Contoh", "ZZZ1"), null);
});

test("peringkat dan jawatan PGB", () => {
  assert.equal(peringkat("SK"), "SR");
  assert.equal(peringkat("SJKC"), "SR");
  assert.equal(peringkat("SJKT"), "SR");
  assert.equal(peringkat("SM"), "SM");
  assert.equal(jawatanPgb("SK"), "Guru Besar");
  assert.equal(jawatanPgb("SJKT"), "Guru Besar");
  assert.equal(jawatanPgb("SM"), "Pengetua");
  assert.equal(jawatanPgb(null), "Pengetua / Guru Besar");
  assert.equal(labelJenisSekolah("SJKC"), "SJK(C)");
});

test("jawatan PGB: Kolej Vokasional = Pengarah, lain-lain tidak berubah", () => {
  const kv = SEKOLAH_MANJUNG.find((s) => s.code === "AHA1002")!;
  assert.equal(jawatanPgb(jenisSekolah(kv.name, kv.code), kv.name), "Pengarah");
  assert.equal(jawatanPgb("SM", "kolej  vokasional contoh"), "Pengarah");
  assert.equal(jawatanPgb("SM", "SMK SERI MANJUNG"), "Pengetua");
  assert.equal(jawatanPgb("SM", "SABK MAAHAD ISLAHIAH ADDINIAH"), "Pengetua");
  assert.equal(jawatanPgb("SK", "SK DENDANG"), "Guru Besar");
  assert.equal(jawatanPgb("SM"), "Pengetua");
});

test("empat sekolah khusus seed Bil.1/2026 dikenali jenisnya", () => {
  const cari = (nama: string) => {
    const hit = SEKOLAH_MANJUNG.filter((s) => s.name === nama);
    assert.equal(hit.length, 1, nama);
    return hit[0]!;
  };
  assert.equal(jenisSekolah(cari("SMK RAJA SHAHRIMAN").name, "AEE1032"), "SM");
  assert.equal(jenisSekolah(cari("SMK PANGKALAN TLDM").name, "AEA1111"), "SM");
  assert.equal(jenisSekolah(cari("SK SERI SELAMAT").name, "ABA1015"), "SK");
  assert.equal(jenisSekolah(cari("SK PENGKALAN BAHARU").name, "ABA1008"), "SK");
});
