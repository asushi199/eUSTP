import type { Bahasa } from "./jenis";

export type JenisRawak = "ulang" | "papan-kekunci" | "bukan-perkataan" | "ime" | "huruf-dijarakkan";

/** Benar jika ada jujukan 3 unsur berturut (perkataan / aksara) yang muncul LEBIH daripada 2 kali. */
function adaFrasaLebih2Kali(unsur: string[]): boolean {
  const kira = new Map<string, number>();
  for (let i = 2; i < unsur.length; i++) {
    const k = `${unsur[i - 2]}${unsur[i - 1]}${unsur[i]}`;
    const n = (kira.get(k) ?? 0) + 1;
    if (n > 2) return true;
    kira.set(k, n);
  }
  return false;
}

/**
 * Kesan teks rawak / berulang (spesifikasi §6 R6). Pulangkan jenis pertama yang
 * dikesan, atau null. Kata ganda BM ("labah labah") dan huruf panjang
 * ("sayangnyaaaa") sengaja TIDAK dikira rawak.
 *
 * "ulang" (teks gelung) memerlukan DUA syarat: kepelbagaian rendah DAN ada frasa yang diulang
 * lebih daripada 2 kali. Frasa/tajuk yang ditulis dua kali sahaja (lazim bagi murid tahap rendah,
 * cth. tajuk buku berkata ganda disalin dua kali) TIDAK ditanda — maklum balas GPM 2026-11-27.
 */
export function kesanRawak(teks: string, bahasa: Bahasa): JenisRawak | null {
  const toks = teks.toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? [];
  let run = 1;
  let maks = 1;
  for (let i = 1; i < toks.length; i++) {
    run = toks[i] === toks[i - 1] ? run + 1 : 1;
    if (run > maks) maks = run;
  }
  if (maks >= 6) return "ulang";

  if (bahasa === "zh") {
    const cs = teks.match(/[一-鿿]/g) ?? [];
    if (cs.length >= 40) {
      const bigram = new Set<string>();
      for (let i = 1; i < cs.length; i++) bigram.add(`${cs[i - 1] ?? ""}${cs[i] ?? ""}`);
      if (bigram.size / (cs.length - 1) < 0.4 && adaFrasaLebih2Kali(cs)) return "ulang";
    }
  } else if (toks.length >= 8 && new Set(toks).size / toks.length < 0.35 && adaFrasaLebih2Kali(toks)) {
    return "ulang";
  }

  if (/(asdf|qwer|zxcv|hjkl)/i.test(teks)) return "papan-kekunci";

  const latin = teks.match(/[A-Za-z]{4,}/g) ?? [];
  if (latin.length >= 4) {
    const buruk = latin.filter((w) => !/[aeiouy]/i.test(w) || /[b-df-hj-np-tv-xz]{5,}/i.test(w)).length;
    if (buruk / latin.length >= 0.3) return "bukan-perkataan";
  }

  if ((teks.match(/(?<=[\u4e00-\u9fff])[A-Za-z](?=[\u4e00-\u9fff])/g) ?? []).length >= 5) return "ime";

  if (/(?<![A-Za-z])[A-Za-z](?:\s+[A-Za-z](?![A-Za-z])){7,}/.test(teks)) return "huruf-dijarakkan";

  return null;
}

/** Tanda baca/simbol sama berulang ≥ 8 kali (cth. "........", ",,,,,,,,", "()()()()()()()()"). */
export function adaSimbolPengisi(teks: string): boolean {
  return /([^\p{L}\p{N}\s]{1,3})\1{7,}/u.test(teks);
}
