import type { Bahasa } from "./jenis";

const KATA_BM = new Set(
  "dan yang di ini itu untuk dengan dalam tidak ada saya kita mereka adalah akan telah ke dari pada oleh juga atau kerana boleh perlu kepada seorang buku cerita bahawa sangat lebih mesti jangan kami ia dia".split(
    " ",
  ),
);
const KATA_EN = new Set(
  "the and is are was were to of in a an that this it he she they we i you for with on not be have has had his her their my our story book about from will can should must when".split(
    " ",
  ),
);

export function kiraHan(s: string): number {
  return (s.match(/[一-鿿]/g) ?? []).length;
}

export function kiraTamil(s: string): number {
  return (s.match(/[஀-௿]/g) ?? []).length;
}

export function adaHan(s: string): boolean {
  return /[一-鿿]/.test(s);
}

export function adaTamil(s: string): boolean {
  return /[஀-௿]/.test(s);
}

/** Pecah kepada perkataan (dipisah ruang; mesti ada huruf/angka). */
export function pecahPerkataan(s: string): string[] {
  return s
    .trim()
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
}

/** Kesan bahasa utama teks (Rumusan + Pengajaran). */
export function kesanBahasa(teks: string): Bahasa {
  const han = kiraHan(teks);
  if (han > 0 && han > pecahPerkataan(teks).length) return "zh";
  const tamil = kiraTamil(teks);
  const latin = (teks.match(/[A-Za-z]/g) ?? []).length;
  if (tamil > 0 && tamil > latin) return "ta";
  const lw = teks.toLowerCase().match(/[a-z']+/g) ?? [];
  if (lw.length === 0) return "lain";
  const bm = lw.filter((w) => KATA_BM.has(w)).length;
  const en = lw.filter((w) => KATA_EN.has(w)).length;
  if (bm > en) return "bm";
  if (en > bm) return "en";
  return "campur";
}
