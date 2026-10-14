import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Tanpa 0/O/1/I/L supaya mudah ditaip daripada skrin atau mesej. */
const ABJAD = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 aksara

/** Buang bukan huruf/nombor dan jadikan huruf besar. */
export function normalKodMuatNaik(kod: string): string {
  return kod.normalize("NFC").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Kod baharu bentuk XXXX-XXXX. Pilihan rawak tanpa bias (rejection sampling). */
export function janaKodMuatNaik(): string {
  const aksara: string[] = [];
  while (aksara.length < 8) {
    for (const b of randomBytes(16)) {
      if (b < 248 && aksara.length < 8) aksara.push(ABJAD[b % ABJAD.length]!); // 248 = 8 × 31
    }
  }
  return `${aksara.slice(0, 4).join("")}-${aksara.slice(4).join("")}`;
}

/**
 * Semak kod muat naik di pelayan dengan perbandingan masa-malar (hash SHA-256 supaya panjang
 * sama). Kod yang dijangka kosong sentiasa ditolak.
 */
export function semakKodMuatNaik(input: string, dijangka: string): boolean {
  const a = normalKodMuatNaik(dijangka);
  if (!a) return false;
  const b = normalKodMuatNaik(input);
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
