import { test } from "node:test";
import assert from "node:assert/strict";
import { adaHan, adaTamil, kesanBahasa, pecahPerkataan } from "./bahasa";
import { ukuranUntuk, ukurPanjang } from "./panjang";

test("kesanBahasa", () => {
  assert.equal(kesanBahasa("这个故事告诉我们要孝顺父母。"), "zh");
  assert.equal(kesanBahasa("ஒரு குரங்கு தன் அம்மாவுடன் வாழ்ந்தது"), "ta");
  assert.equal(kesanBahasa("Kita hendaklah membantu orang yang susah dan jangan sombong."), "bm");
  assert.equal(kesanBahasa("The boy learns that he should help his friends."), "en");
  assert.equal(kesanBahasa("okey okey"), "campur");
  assert.equal(kesanBahasa("12345 ...."), "lain");
});

test("adaHan / adaTamil", () => {
  assert.equal(adaHan("《小王子》"), true);
  assert.equal(adaHan("THE LITTLE PRINCE"), false);
  assert.equal(adaTamil("சிண்ட்ரெல்லா"), true);
});

test("pecahPerkataan abaikan token tanda baca sahaja", () => {
  assert.deepEqual(pecahPerkataan("  Kita perlu  rajin . "), ["Kita", "perlu", "rajin"]);
});

test("ukurPanjang: aksara Han untuk Cina, perkataan untuk lain", () => {
  assert.equal(ukurPanjang("我们不能轻敌。", "zh"), 6);
  assert.equal(ukurPanjang("Kita perlu rajin membaca.", "bm"), 4);
  assert.equal(ukuranUntuk("zh"), "zh");
  assert.equal(ukuranUntuk("ta"), "kata");
});
