/**
 * Mesej dan pembantu untuk laluan awam MJKD yang dibungkus `withDbTimeout()` (lihat
 * AI_CONTEXT_LOG "Diagnosis produksi: halaman tergantung 300s"). Tulen — selamat untuk klien.
 */

export const MESEJ_DB_PERLAHAN = "Pangkalan data mengambil masa terlalu lama. Sila cuba semula sebentar lagi.";

/** Maklum balas: komit mungkin berlaku selepas timeout, jadi status tidak pasti. */
export const MESEJ_PENGHANTARAN_TIDAK_PASTI =
  "Sambungan perlahan — status penghantaran tidak pasti. Sila cuba hantar semula. " +
  "Jika sistem menyatakan sekolah sudah menghantar, hubungi urusetia MJKD untuk nombor tiket.";

/** Bahan: baris mungkin sudah disimpan selepas fail dimuat naik. */
export const MESEJ_BAHAN_TIDAK_PASTI =
  "Sambungan perlahan — status muat naik tidak pasti. Semak bahagian Bahan pada halaman " +
  "MJKD 2026 sebelum menghantar semula (elak bahan berganda), atau hubungi urusetia MJKD.";

/** Ralat rangkaian/500 di klien (tindakan pelayan melontar). */
export const MESEJ_RALAT_SAMBUNGAN = "Sambungan bermasalah. Sila cuba semula sebentar lagi.";

/** Ralat umum selain timeout daripada laluan awam (tanpa mendedahkan mesej dalaman). */
export const MESEJ_RALAT_UMUM = "Gagal memproses permintaan. Sila cuba semula.";

/** Ralat yang dilontar oleh `withDbTimeout()`. */
export function isRalatTimeoutDb(e: unknown): boolean {
  return e instanceof Error && /Pangkalan data tidak bertindak balas/.test(e.message);
}

/** Pautan "muat semula" ke URL yang sama (termasuk parameter carian). */
export function pautanMuatSemula(
  path: string,
  params: Record<string, string | string[] | undefined> = {},
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
    else if (v !== undefined && v !== "") q.set(k, v);
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
