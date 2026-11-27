import { test } from "node:test";
import assert from "node:assert/strict";
import { bukuSama, normalTeks, tarikhHantar } from "./normal";

test("normalTeks buang tanda baca, ruang dan huruf besar", () => {
  assert.equal(normalTeks("Modul Etika - BAB 1!"), "moduletikabab1");
  assert.equal(normalTeks("《小王子》 "), "小王子");
});

test("bukuSama: awalan kategori/siri bukan buku sama", () => {
  const kategori = normalTeks("UJI KAJI SAINS");
  const a = normalTeks("UJI KAJI SAINS - MENGKAJI DAYA APUNGAN");
  const b = normalTeks("UJI KAJI SAINS - MENGKAJI KADAR PENYEJATAN");
  assert.equal(bukuSama(kategori, a), false);
  assert.equal(bukuSama(a, b), false);
  assert.equal(bukuSama(normalTeks("Sang Kancil"), normalTeks("Sang Kancil dan Buaya")), false);
});

test("bukuSama: sama tepat atau tajuk pendek di hujung tajuk panjang (≥ 6 aksara)", () => {
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
