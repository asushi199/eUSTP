import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ESN_TARIKH_AKHIR, jumlahMuridEsn, jumlahSekolahEsn, semakEsn, type EsnSnapshot } from "../../lib/analisis/esn-types";

const snap = JSON.parse(readFileSync("scripts/data/esn-2026-10-16.json", "utf8")) as EsnSnapshot;

test("snapshot ESN 2026: senarai sekolah sepadan angka Dashboard", () => {
  assert.deepEqual(semakEsn(snap), []);
});

test("jumlah ESN 2026: 103 sekolah, 335/3837 murid selesai", () => {
  assert.equal(jumlahSekolahEsn(snap).jumlah, 103);
  const m = jumlahMuridEsn(snap);
  assert.equal(m.siap, 335);
  assert.equal(m.jumlah, 3837);
});

test("semakEsn mengesan sekolah tidak sepadan", () => {
  const rosak: EsnSnapshot = { ...snap, sekolah: snap.sekolah.slice(1) };
  assert.ok(semakEsn(rosak).length > 0);
});

test("tarikh akhir ESN 2026 = 15 Disember", () => {
  assert.equal(ESN_TARIKH_AKHIR[2026], "2026-12-15");
});
