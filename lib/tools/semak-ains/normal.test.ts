import { test } from "node:test";
import assert from "node:assert/strict";
import { bukuSama, normalTeks, tarikhHantar } from "./normal";

test("normalTeks buang tanda baca, ruang dan huruf besar", () => {
  assert.equal(normalTeks("Modul Etika - BAB 1!"), "moduletikabab1");
  assert.equal(normalTeks("《小王子》 "), "小王子");
});

test("bukuSama: sama tepat atau satu mengandungi yang lain (≥ 6 aksara)", () => {
  assert.equal(bukuSama("sangkancil", "sangkancil"), true);
  assert.equal(
    bukuSama(normalTeks("MODUL ETIKA SIBER - PRIVASI DIGITAL"), normalTeks("PRIVASI DIGITAL")),
    true,
  );
  assert.equal(bukuSama("abc", "abcd"), false);
  assert.equal(bukuSama("sangkancil", "sangbuaya"), false);
});

test("tarikhHantar daripada meta AINS", () => {
  assert.equal(tarikhHantar("Buku / e-Buku · Dihantar 25 Nov 2026, 9:31 pm"), "25 Nov 2026");
  assert.equal(tarikhHantar("Buku / e-Buku"), "");
});
