import { test } from "node:test";
import assert from "node:assert/strict";
import { janaKomen } from "../komen";
import { STANDARD_DAERAH } from "../standard";
import { BAHASA_UI, KAMUS, bahasaSah, terjemahRalatPenanda } from "./index";

/** Kumpul semua nilai daun kamus; fungsi dipanggil dengan hujah contoh. */
function daun(o: unknown, laluan = ""): [string, string][] {
  if (typeof o === "string") return [[laluan, o]];
  if (typeof o === "function") {
    const hasil: unknown = (o as (...a: unknown[]) => unknown)("7", "8", "9", "10");
    return [[laluan, String(hasil)]];
  }
  if (o !== null && typeof o === "object") {
    return Object.entries(o).flatMap(([k, v]) => daun(v, laluan ? `${laluan}.${k}` : k));
  }
  return [];
}

test("kamus: setiap bahasa mempunyai kunci yang sama dan tiada nilai kosong", () => {
  const rujukan = daun(KAMUS.ms).map(([l]) => l);
  for (const { kod } of BAHASA_UI) {
    const d = daun(KAMUS[kod]);
    assert.deepEqual(d.map(([l]) => l), rujukan, `kunci ${kod}`);
    for (const [l, v] of d) assert.ok(v.trim() !== "", `${kod}.${l} kosong`);
  }
});

test("kamus zh/ta: benar-benar diterjemah (bukan salinan BM) bagi label utama", () => {
  for (const kod of ["zh", "ta"] as const) {
    assert.notEqual(KAMUS[kod].warna.hijau, KAMUS.ms.warna.hijau);
    assert.notEqual(KAMUS[kod].sebab["terlalu-pendek"], KAMUS.ms.sebab["terlalu-pendek"]);
    assert.notEqual(KAMUS[kod].komenLalai["terlalu-pendek"], KAMUS.ms.komenLalai["terlalu-pendek"]);
  }
});

test("bahasaSah", () => {
  assert.equal(bahasaSah("zh"), true);
  assert.equal(bahasaSah("en"), false);
  assert.equal(bahasaSah(null), false);
});

test("terjemahRalatPenanda: mesej tetap, berparameter dan gabungan", () => {
  const R = KAMUS.ms.ralatPenanda;
  assert.equal(terjemahRalatPenanda(R.sibuk, KAMUS.ms), R.sibuk);
  assert.equal(terjemahRalatPenanda(R.sibuk, KAMUS.zh), KAMUS.zh.ralatPenanda.sibuk);
  const gabung = `${R.tigaGagal} ${R.hanyaTurun("2", "40")}`;
  assert.equal(
    terjemahRalatPenanda(gabung, KAMUS.ta),
    `${KAMUS.ta.ralatPenanda.tigaGagal} ${KAMUS.ta.ralatPenanda.hanyaTurun("2", "40")}`,
  );
  assert.equal(terjemahRalatPenanda(R.takDijangka("TypeError: x"), KAMUS.zh), KAMUS.zh.ralatPenanda.takDijangka("TypeError: x"));
  assert.equal(terjemahRalatPenanda(R.gagalHalaman("12"), KAMUS.zh), KAMUS.zh.ralatPenanda.gagalHalaman("12"));
  // Teks yang tidak dikenali (cth. jawapan mentah AINS) dikekalkan.
  assert.equal(terjemahRalatPenanda("error 500", KAMUS.zh), "error 500");
});

test("mesej penanda.js sepadan dengan kamus BM (jika berubah, terjemahan tidak lagi terpakai)", async () => {
  const { readFile } = await import("node:fs/promises");
  const sumber = await readFile("public/tools/semak-ains/penanda.js", "utf8");
  const R = KAMUS.ms.ralatPenanda;
  for (const teks of [R.sibuk, R.dihentikan, R.tigaGagal, R.takDapatSahkan, R.ditutupBaca, R.ditutupLaksana, R.tiadaId]) {
    assert.ok(sumber.includes(teks), `penanda.js tiada: ${teks}`);
  }
});

test("janaKomen: komen lalai mengikut bahasa; suntingan GPM diutamakan", () => {
  const zh = janaKomen(["terlalu-pendek"], [], STANDARD_DAERAH, {}, KAMUS.zh.komenLalai);
  assert.equal(zh, KAMUS.zh.komenLalai["terlalu-pendek"]);
  const ganti = janaKomen(["terlalu-pendek"], [], STANDARD_DAERAH, { "terlalu-pendek": "Tulis lagi." }, KAMUS.zh.komenLalai);
  assert.equal(ganti, "Tulis lagi.");
});
