/**
 * Had surat permohonan (selamat untuk klien + pelayan).
 *
 * Vercel menghadkan badan permintaan fungsi kepada 4.5 MB, jadi fail besar
 * TIDAK boleh melalui Server Action. Fail > SURAT_DIRECT_MAX dimuat naik
 * berketul (resumable Drive) — setiap ketul ≤ SURAT_CHUNK_BYTES.
 */

/** Maksimum saiz surat (PDF/imej). Muat naik berketul tiada had 4.5 MB Vercel. */
export const SURAT_MAX_BYTES = 15 * 1024 * 1024;
export const SURAT_MAX_LABEL = "15 MB";

/** Di bawah ambang ini guna laluan terus (Server Action → GAS). */
export const SURAT_DIRECT_MAX = 3_500_000;

/** Mesti gandaan 256 KiB (syarat Drive resumable) dan < 4.5 MB. */
export const SURAT_CHUNK_BYTES = 12 * 256 * 1024; // 3 MiB
