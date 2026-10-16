import assert from "node:assert/strict";
import test from "node:test";
import { namaKunci, padankanKod, parseD3Csv, semakJumlah } from "../../lib/analisis/delima-d3-parse";

const CSV = `sekolah,guru_aktif,guru_jumlah,murid_aktif,murid_jumlah
PPD MANJUNG,"1,000",1010,85,197
SEKOLAH KEBANGSAAN METHODIST (ACS) [1],950,960,40,50
SEKOLAH KEBANGSAAN METHODIST (ACS) [2],50,50,45,147
`;

test("parseD3Csv: daerah + sekolah, peratus 2 titik perpuluhan", () => {
  const d = parseD3Csv(CSV);
  assert.equal(d.daerah.nama, "PPD MANJUNG");
  assert.deepEqual(d.daerah.guru, { aktif: 1000, jumlah: 1010, peratus: 99.01 });
  assert.equal(d.sekolah.length, 2);
  assert.equal(d.sekolah[1].murid.peratus, 30.61);
  assert.deepEqual(semakJumlah(d), []);
});

test("parseD3Csv: tolak baris pertama bukan PPD dan aktif > jumlah", () => {
  assert.throws(() => parseD3Csv("sekolah,guru_aktif,guru_jumlah,murid_aktif,murid_jumlah\nSK A,1,1,1,1\n"), /PPD/);
  assert.throws(
    () => parseD3Csv("sekolah,guru_aktif,guru_jumlah,murid_aktif,murid_jumlah\nPPD X,1,1,1,1\nSK A,2,1,0,0\n"),
    /melebihi/,
  );
});

test("semakJumlah: kesan jumlah tidak sepadan", () => {
  const d = parseD3Csv(CSV.replace("950,960", "951,960"));
  assert.equal(semakJumlah(d).length, 1);
});

test("namaKunci: abaikan [n], titik, apostrof, ruang", () => {
  assert.equal(namaKunci("SK  KPG. DATO' SERI [2]"), "SK KPG DATO SERI");
});

test("padankanKod: nama berulang dipadan ikut jumlah paling hampir, tidak ikut susunan", () => {
  const d = parseD3Csv(CSV);
  const { padan, tiada } = padankanKod(d.sekolah, [
    { kod: "B", nama: "SEKOLAH KEBANGSAAN METHODIST (ACS)", guruJumlah: 50, muridJumlah: 147 },
    { kod: "A", nama: "SEKOLAH KEBANGSAAN METHODIST (ACS)", guruJumlah: 960, muridJumlah: 50 },
  ]);
  assert.deepEqual(tiada, []);
  assert.deepEqual(padan.map((p) => p.kod), ["A", "B"]);
});

test("padankanKod: nama tiada dalam rujukan dilaporkan", () => {
  const d = parseD3Csv(CSV);
  const { padan, tiada } = padankanKod(d.sekolah, [
    { kod: "A", nama: "SEKOLAH KEBANGSAAN METHODIST (ACS)", guruJumlah: 960, muridJumlah: 50 },
  ]);
  assert.equal(padan.length, 1);
  assert.equal(tiada.length, 1);
});
