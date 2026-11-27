import assert from "node:assert/strict";
import test from "node:test";
import { bacaMuatanD3, muatanDariSerpihan } from "../../lib/analisis/delima-d3-penanda";
import { semakJumlah } from "../../lib/analisis/delima-d3-parse";

const HARI_INI = "2026-11-27";
const muatan = (ubah: Record<string, unknown> = {}) => ({
  v: 1,
  tarikh: HARI_INI,
  mula: "2026-01-01",
  daerah: ["PPD MANJUNG", 1000, 1010, 85, 197],
  sekolah: [
    ["SEKOLAH KEBANGSAAN A", 950, 960, 40, 50],
    ["SEKOLAH KEBANGSAAN B", 50, 50, 45, 147],
  ],
  ...ubah,
});

test("bacaMuatanD3: muatan sah → D3Data dengan peratus, jumlah sepadan", () => {
  const h = bacaMuatanD3(muatan(), HARI_INI);
  assert.ok(h.ok);
  assert.equal(h.tarikh, HARI_INI);
  assert.deepEqual(h.data.daerah.guru, { aktif: 1000, jumlah: 1010, peratus: 99.01 });
  assert.equal(h.data.sekolah[1]!.murid.peratus, 30.61);
  assert.deepEqual(semakJumlah(h.data), []);
});

test("bacaMuatanD3: tolak bentuk rosak, nombor bukan integer dan aktif > jumlah", () => {
  assert.equal(bacaMuatanD3(null, HARI_INI).ok, false);
  assert.equal(bacaMuatanD3(muatan({ sekolah: [] }), HARI_INI).ok, false);
  assert.equal(bacaMuatanD3(muatan({ daerah: ["PPD MANJUNG", 1.5, 2, 1, 1] }), HARI_INI).ok, false);
  assert.equal(bacaMuatanD3(muatan({ daerah: ["PPD MANJUNG", -1, 2, 1, 1] }), HARI_INI).ok, false);
  const lebih = bacaMuatanD3(muatan({ sekolah: [["SK A", 5, 4, 0, 0]] }), HARI_INI);
  assert.ok(!lebih.ok && /melebihi/.test(lebih.error));
});

test("bacaMuatanD3: tolak data lama, tarikh palsu, tempoh bukan 1 Jan dan daerah bukan PPD", () => {
  const lama = bacaMuatanD3(muatan({ tarikh: "2026-11-20" }), HARI_INI);
  assert.ok(!lama.ok && /lama/.test(lama.error));
  assert.equal(bacaMuatanD3(muatan({ tarikh: "2026-11-26" }), HARI_INI).ok, true);
  assert.equal(bacaMuatanD3(muatan({ tarikh: "2026-02-31" }), "2026-03-01").ok, false);
  assert.equal(bacaMuatanD3(muatan({ mula: "2026-11-01" }), HARI_INI).ok, false);
  assert.equal(bacaMuatanD3(muatan({ daerah: ["SK A", 1, 1, 1, 1] }), HARI_INI).ok, false);
});

test("bacaMuatanD3: tolak penanda versi lama", () => {
  const h = bacaMuatanD3(muatan({ v: 0 }), HARI_INI);
  assert.equal(h.ok, false);
});

test("muatanDariSerpihan: baca #d=, abaikan serpihan lain atau rosak", () => {
  const m = muatan();
  assert.deepEqual(muatanDariSerpihan(`#d=${encodeURIComponent(JSON.stringify(m))}`), m);
  assert.equal(muatanDariSerpihan(""), null);
  assert.equal(muatanDariSerpihan("#bahagian"), null);
  assert.equal(muatanDariSerpihan("#d=%7Brosak"), null);
});
