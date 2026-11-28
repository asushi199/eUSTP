import { test } from "node:test";
import assert from "node:assert/strict";
import { STANDARD_DAERAH, bezaStandard, gabungStandard, tetapanBeza } from "./standard";

test("tanpa tetapan = standard daerah", () => {
  assert.deepEqual(gabungStandard(null), STANDARD_DAERAH);
  assert.deepEqual(bezaStandard(gabungStandard(undefined)), {});
});

test("tetapan GPM menggantikan nilai berkaitan sahaja", () => {
  const s = gabungStandard({ ambang: { kata: { "D5-6": { merah: 8 } } }, aktivitiKelas: "kuning" });
  assert.equal(s.ambang.kata["D5-6"].merah, 8);
  assert.equal(s.ambang.kata["D5-6"].kuning, 20);
  assert.equal(s.aktivitiKelas, "kuning");
  assert.deepEqual(bezaStandard(s), { "ambang.kata.D5-6.merah": 8, aktivitiKelas: "kuning" });
});

test("nilai tidak sah diabaikan atau dihadkan", () => {
  const s = gabungStandard({
    jedaMs: 50,
    hantarSemulaSama: "salah" as never,
    ambang: { zh: { M: { merah: 200, kuning: 100 } } },
  });
  assert.equal(s.jedaMs, 300);
  assert.equal(s.hantarSemulaSama, "merah");
  assert.equal(s.ambang.zh.M.merah, 200);
  assert.equal(s.ambang.zh.M.kuning, 200);
});

test("tetapanBeza simpan medan berubah sahaja (termasuk komen); bezaStandard abaikan komen", () => {
  const s = gabungStandard({ bahasaTakSepadan: false, komen: { templat: "Tulis sendiri." } });
  assert.deepEqual(tetapanBeza(s), { bahasaTakSepadan: false, komen: { templat: "Tulis sendiri." } });
  assert.deepEqual(bezaStandard(s), { bahasaTakSepadan: false });
});

test("bahasaBercampur: lalai abai, boleh ditetapkan, nilai tidak sah diabaikan", () => {
  assert.equal(STANDARD_DAERAH.bahasaBercampur, "abai");
  assert.equal(gabungStandard({ bahasaBercampur: "kuning" }).bahasaBercampur, "kuning");
  assert.equal(gabungStandard({ bahasaBercampur: "salah" as never }).bahasaBercampur, "abai");
});
