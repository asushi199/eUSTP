/** Normalkan teks untuk perbandingan: NFKC, huruf kecil, buang semua selain huruf/tanda/angka. */
export function normalTeks(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, "");
}

/**
 * Dua tajuk (sudah dinormalkan) dianggap buku sama jika sama, atau tajuk yang lebih pendek
 * (≥ 6 aksara) ialah HUJUNG tajuk yang lebih panjang — cth. "MODUL X - BAB Y" dan "BAB Y".
 *
 * Tajuk pendek yang hanya menjadi AWALAN atau bahagian tengah TIDAK dikira sama (enjin 1.1.0):
 * awalan biasanya nama kategori/siri, bukan buku — cth. "EKSPERIMEN SAINS" berbanding
 * "EKSPERIMEN SAINS - MENGKAJI MOMENTUM", atau "SANG KANCIL" berbanding "SANG KANCIL DAN BUAYA".
 * Dahulu satu rekod bertajuk kategori sahaja menandakan SEMUA rekod siri itu sebagai buku sama.
 */
export function bukuSama(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 6 || b.length < 6) return false;
  return a.endsWith(b) || b.endsWith(a);
}

/** Tarikh hantar daripada meta AINS, cth. "25 Nov 2026"; "" jika tiada. */
export function tarikhHantar(meta: string): string {
  const m = meta.match(/Dihantar\s+(\d{1,2}\s+\S+\s+\d{4})/);
  return m?.[1]?.replace(/\s+/g, " ") ?? "";
}
