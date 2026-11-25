/** Normalkan teks untuk perbandingan: NFKC, huruf kecil, buang semua selain huruf/tanda/angka. */
export function normalTeks(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, "");
}

/**
 * Dua tajuk (sudah dinormalkan) dianggap buku sama jika sama, atau salah satu
 * mengandungi yang lain dan kedua-duanya ≥ 6 aksara.
 */
export function bukuSama(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 6 || b.length < 6) return false;
  return a.includes(b) || b.includes(a);
}

/** Tarikh hantar daripada meta AINS, cth. "25 Nov 2026"; "" jika tiada. */
export function tarikhHantar(meta: string): string {
  const m = meta.match(/Dihantar\s+(\d{1,2}\s+\S+\s+\d{4})/);
  return m?.[1]?.replace(/\s+/g, " ") ?? "";
}
