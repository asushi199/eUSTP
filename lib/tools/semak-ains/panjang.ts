import { kiraHan, pecahPerkataan } from "./bahasa";
import type { Bahasa, Ukuran } from "./jenis";

export function ukuranUntuk(bahasa: Bahasa): Ukuran {
  return bahasa === "zh" ? "zh" : "kata";
}

/** Panjang dalam aksara Han (Cina) atau perkataan (lain-lain). */
export function ukurPanjang(s: string, bahasa: Bahasa): number {
  return bahasa === "zh" ? kiraHan(s) : pecahPerkataan(s).length;
}
