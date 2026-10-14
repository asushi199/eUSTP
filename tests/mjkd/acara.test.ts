import assert from "node:assert/strict";
import test from "node:test";
import { fasaAcara, julatTarikh } from "../../lib/mjkd/acara";

test("julatTarikh: satu hari, bulan sama, bulan berbeza", () => {
  assert.equal(julatTarikh("2026-10-21", null), "21 Oktober 2026");
  assert.equal(julatTarikh("2026-10-21", "2026-10-22"), "21–22 Oktober 2026");
  assert.equal(julatTarikh("2026-10-31", "2026-11-01"), "31 Oktober – 1 November 2026");
  assert.equal(julatTarikh("2026-10-21", "2026-10-21"), "21 Oktober 2026");
});

test("fasaAcara: akan, berlangsung (hari ke-n), selesai", () => {
  assert.deepEqual(fasaAcara("2026-10-21", "2026-10-22", "2026-10-14"), { jenis: "akan", hari: 7 });
  assert.deepEqual(fasaAcara("2026-10-21", "2026-10-22", "2026-10-21"), {
    jenis: "berlangsung",
    hariKe: 1,
    jumlah: 2,
  });
  assert.deepEqual(fasaAcara("2026-10-21", "2026-10-22", "2026-10-22"), {
    jenis: "berlangsung",
    hariKe: 2,
    jumlah: 2,
  });
  assert.deepEqual(fasaAcara("2026-10-21", "2026-10-22", "2026-10-23"), { jenis: "selesai" });
});
