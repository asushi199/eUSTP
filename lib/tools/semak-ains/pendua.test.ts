import { test } from "node:test";
import assert from "node:assert/strict";
import { normalTeks } from "./normal";
import { kesanPendua, type InputPendua } from "./pendua";

const PANJANG =
  "Cerita ini mengisahkan seekor kancil yang cerdik menyeberang sungai dengan menipu buaya.";

function rek(
  id: string,
  murid: string,
  tajuk: string,
  rumusan = PANJANG,
  kelas = "TAHUN 5 5A",
  tarikh = "25 Nov 2026",
): InputPendua {
  return { id, murid, kelas, tarikh, tajukN: normalTeks(tajuk), rumusanN: normalTeks(rumusan) };
}

test("templat: rumusan sama untuk ≥ 3 buku", () => {
  const h = kesanPendua([rek("1", "ALI", "Buku Satu"), rek("2", "ABU", "Buku Dua"), rek("3", "AHMAD", "Buku Tiga")]);
  assert.equal(h.get("1")?.templat, true);
  assert.equal(h.get("3")?.templat, true);
});

test("rumusan sama untuk 2 buku", () => {
  const h = kesanPendua([rek("1", "ALI", "Buku Satu"), rek("2", "ALI", "Buku Dua")]);
  assert.equal(h.get("1")?.sama2Buku, true);
  assert.equal(h.get("1")?.templat, false);
});

test("aktiviti kelas: murid lain, buku, kelas & hari sama", () => {
  const h = kesanPendua([rek("1", "ALI", "Sang Kancil"), rek("2", "ABU", "SANG KANCIL")]);
  assert.equal(h.get("1")?.aktivitiKelas, true);
  assert.equal(h.get("1")?.samaMuridLain, false);
});

test("sama dengan murid lain dari kelas berbeza", () => {
  const h = kesanPendua([rek("1", "ALI", "Sang Kancil"), rek("2", "ABU", "Sang Kancil", PANJANG, "TAHUN 5 5B")]);
  assert.equal(h.get("1")?.samaMuridLain, true);
});

test("hantar semula sama vs buku sama berulang", () => {
  const a = kesanPendua([rek("1", "ALI", "Sang Kancil"), rek("2", "ALI", "Sang Kancil")]);
  assert.equal(a.get("2")?.hantarSemulaSama, true);
  const b = kesanPendua([
    rek("1", "ALI", "Sang Kancil"),
    rek("2", "ALI", "Sang Kancil", "Kancil menipu buaya untuk menyeberang sungai yang luas dan dalam itu."),
  ]);
  assert.equal(b.get("1")?.bukuSamaBerulang, true);
  assert.equal(b.get("1")?.hantarSemulaSama, false);
});

test("rumusan pendek (< 40 aksara) tidak dikira pendua", () => {
  const h = kesanPendua([
    rek("1", "ALI", "A1 Buku", "Bagus."),
    rek("2", "ABU", "B2 Buku", "Bagus."),
    rek("3", "AHMAD", "C3 Buku", "Bagus."),
  ]);
  assert.equal(h.get("1")?.templat, false);
});

test("R5: salinan pertama tidak ditanda, hanya salinan kemudian", () => {
  const h = kesanPendua([rek("1", "ALI", "Sang Kancil"), rek("2", "ALI", "Sang Kancil")]);
  assert.equal(h.get("1")?.hantarSemulaSama, false);
  assert.equal(h.get("2")?.hantarSemulaSama, true);
});

test("murid dikunci murid|kelas: nama sama kelas berbeza bukan murid sama", () => {
  const h = kesanPendua([
    rek("1", "ALI", "Sang Kancil", PANJANG, "TAHUN 5 5A"),
    rek("2", "ALI", "Sang Kancil", PANJANG, "TAHUN 5 5B"),
  ]);
  assert.equal(h.get("1")?.hantarSemulaSama, false);
  assert.equal(h.get("2")?.hantarSemulaSama, false);
  assert.equal(h.get("1")?.bukuSamaBerulang, false);
});

test("aktiviti kelas: beberapa murid ubah tajuk tidak jadikan templat", () => {
  const rekod: InputPendua[] = [];
  for (let i = 1; i <= 8; i++) rekod.push(rek(`k${i}`, `MURID ${i}`, "Sang Kancil"));
  rekod.push(rek("t1", "MURID 9", "Sang Kncil"));
  rekod.push(rek("t2", "MURID 10", "Kancil dan Buaya"));
  const h = kesanPendua(rekod);
  for (const r of rekod) {
    assert.equal(h.get(r.id)?.templat, false, r.id);
    assert.equal(h.get(r.id)?.sama2Buku, false, r.id);
  }
  for (let i = 1; i <= 8; i++) assert.equal(h.get(`k${i}`)?.aktivitiKelas, true);
  assert.equal(h.get("t1")?.samaMuridLain, true);
  assert.equal(h.get("t2")?.samaMuridLain, true);
});

test("3 tajuk berbeza merentas kelas masih templat", () => {
  const h = kesanPendua([
    rek("1", "ALI", "Buku Satu", PANJANG, "TAHUN 5 5A"),
    rek("2", "ABU", "Buku Dua", PANJANG, "TAHUN 5 5B"),
    rek("3", "AHMAD", "Buku Tiga", PANJANG, "TAHUN 5 5C"),
  ]);
  assert.equal(h.get("1")?.templat, true);
  assert.equal(h.get("3")?.templat, true);
});
