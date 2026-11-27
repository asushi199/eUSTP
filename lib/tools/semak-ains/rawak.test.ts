import { test } from "node:test";
import assert from "node:assert/strict";
import { adaSimbolPengisi, kesanRawak } from "./rawak";

test("ulang: perkataan sama ≥ 6 kali berturut", () => {
  assert.equal(kesanRawak("today today today today today today is mala", "en"), "ulang");
});

test("ulang: teks gelung (perkataan unik < 35%)", () => {
  assert.equal(
    kesanRawak("I I see I see the I see the rabbit I see the rabbit I see the rabbit", "en"),
    "ulang",
  );
});

test("ulang: frasa diulang 2 kali sahaja TIDAK ditanda; lebih 2 kali ditanda", () => {
  // Tajuk berkata ganda disalin dua kali (perkataan unik < 35%, tetapi tiada frasa > 2 kali).
  const duaKali = "Rama rama dan lebah lebah. Rama rama dan lebah lebah. Lebah baik.";
  assert.equal(kesanRawak(duaKali, "bm"), null);
  assert.equal(kesanRawak(`${duaKali} Rama rama dan lebah lebah.`, "bm"), "ulang");
});

test("ulang: aksara Cina berulang", () => {
  assert.equal(kesanRawak("哈".repeat(50), "zh"), "ulang");
});

test("papan kekunci", () => {
  assert.equal(kesanRawak("asdfgh jkl saya suka", "bm"), "papan-kekunci");
});

test("bukan perkataan (tiada vokal / konsonan panjang)", () => {
  assert.equal(kesanRawak("RNFRK WRFWRQNV BCDFG KLMNP TRSPL cerita", "campur"), "bukan-perkataan");
});

test("sisa IME dalam teks Cina", () => {
  assert.equal(kesanRawak("甲a乙丙b丁戊c己庚d辛壬e癸", "zh"), "ime");
  assert.equal(kesanRawak("甲a乙b丙c丁d戊e己", "zh"), "ime");
});

test("huruf dijarakkan", () => {
  assert.equal(
    kesanRawak("K i n i ,  m e r e k a   h i d u p   s e l e s a", "campur"),
    "huruf-dijarakkan",
  );
});

test("teks biasa (termasuk kata ganda & huruf panjang) bukan rawak", () => {
  assert.equal(
    kesanRawak(
      "Kita hendaklah membantu labah labah itu kerana ia kesayangannyaaaaa dan comel sekali",
      "bm",
    ),
    null,
  );
  assert.equal(
    kesanRawak(
      "这个故事讲述沉香为了寻找被困住的母亲，勇敢地踏上艰难的旅程，最终成功救出母亲。我们应该孝顺父母。",
      "zh",
    ),
    null,
  );
  assert.equal(
    kesanRawak("The beetle fell into the fountain and a kind dragonfly saved it from drowning.", "en"),
    null,
  );
});

test("simbol pengisi", () => {
  assert.equal(adaSimbolPengisi("sangat bijak......................"), true);
  assert.equal(adaSimbolPengisi("()()()()()()()()()"), true);
  assert.equal(adaSimbolPengisi("Hebat!!! Terima kasih."), false);
});

test("angka Arab antara aksara Cina bukan sisa IME", () => {
  assert.equal(
    kesanRawak("第1只小猪盖了草房子，第2只小猪盖了木房子，第3只小猪盖了砖房子。大野狼吹了2次，过了3天它又来了。", "zh"),
    null,
  );
});
