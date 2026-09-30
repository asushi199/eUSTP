import assert from "node:assert/strict";
import test from "node:test";
import {
  ANUGERAH,
  GURU,
  PENYERTAAN_RINGKASAN as R,
  PERTANDINGAN,
  SEKOLAH,
  TOP5_DATA,
  analisisPenyertaan,
  penyertaanHomeModule,
} from "../../lib/analisis/penyertaan";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

test("jumlah pertandingan padan helaian RINGKASAN", () => {
  assert.equal(sum(PERTANDINGAN.map((p) => p.penyertaan)), R.penyertaan);
  assert.equal(sum(PERTANDINGAN.map((p) => p.top5)), R.top5);
  assert.equal(sum(PERTANDINGAN.map((p) => p.mata)), R.mata);
  assert.equal(sum(PERTANDINGAN.map((p) => p.sijil)), R.sijilPencapaian + R.sijilSekolah);
  assert.equal(R.sijilPencapaian + R.sijilSekolah + R.sijilGuruTerbaik, R.sijilJumlah);
});

test("jumlah sekolah padan jumlah pertandingan dan ringkasan", () => {
  assert.equal(SEKOLAH.length, R.sekolahTerlibat);
  assert.equal(sum(SEKOLAH.map((s) => s.jumlah)), R.penyertaan);
  assert.equal(sum(SEKOLAH.map((s) => s.top5)), R.top5);
  assert.equal(sum(SEKOLAH.map((s) => s.mata)), R.mata);
  for (const p of PERTANDINGAN) {
    assert.equal(sum(SEKOLAH.map((s) => s.penyertaan[p.kod] ?? 0)), p.penyertaan, p.kod);
  }
});

test("Top 5 padan pertandingan, sekolah dan mata", () => {
  assert.equal(TOP5_DATA.length, R.top5);
  assert.equal(sum(TOP5_DATA.map((t) => t.mata)), R.mata);
  assert.equal(sum(ANUGERAH.map((a) => a.bil)), R.top5);
  for (const p of PERTANDINGAN) {
    assert.equal(TOP5_DATA.filter((t) => t.pertandingan === p.kod).length, p.top5, p.kod);
  }
  for (const s of SEKOLAH) {
    const rows = TOP5_DATA.filter((t) => t.kodSekolah === s.kod);
    assert.equal(rows.length, s.top5, s.kod);
    assert.equal(sum(rows.map((t) => t.mata)), s.mata, s.kod);
  }
});

test("guru digabung dan mata padan Top 5", () => {
  assert.equal(GURU.length, R.guruBaris - 4);
  assert.equal(sum(GURU.map((g) => g.top5)), R.top5);
  assert.equal(sum(GURU.map((g) => g.mata)), R.mata);
  assert.equal(GURU[0].kedudukan, 1);
});

test("analisis: kadar kejayaan dan kad halaman utama", () => {
  const a = analisisPenyertaan();
  assert.equal(a.kadarKeseluruhan, 9.3);
  assert.equal(a.dapatan.length, 5);
  assert.equal(penyertaanHomeModule.headlineValue, "194");
  assert.equal(penyertaanHomeModule.id, "penyertaan");
});
