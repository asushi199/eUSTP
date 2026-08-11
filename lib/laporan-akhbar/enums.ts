/** Pilihan rasmi dari sheet Senarai template JPN Langganan Akhbar 2026. */

export const AKHBAR_YEAR = 2026;
export const AKHBAR_PPD = "Manjung";

/** Jawatan rasmi pegawai penyemak PPD (bukan nama akaun log masuk). */
export const AKHBAR_PEGAWAI_PPD_DEFAULT =
  "Penolong PPD (Unit Sumber dan Teknologi)";

/**
 * Guna jawatan rasmi jika medan kosong, atau nilai lama masih nama akaun
 * (tiada sebutan PPD). Nilai yang sudah mengandungi "PPD" dikekalkan.
 */
export function resolveAkhbarPegawaiPpd(
  stored?: string | null,
  accountName?: string | null,
): string {
  const v = (stored ?? "").trim();
  if (!v) return AKHBAR_PEGAWAI_PPD_DEFAULT;
  const account = (accountName ?? "").trim();
  if (account && v === account) return AKHBAR_PEGAWAI_PPD_DEFAULT;
  if (!/ppd/i.test(v)) return AKHBAR_PEGAWAI_PPD_DEFAULT;
  return v;
}

export const YA_TIDAK = ["Ya", "Tidak"] as const;
export type YaTidak = (typeof YA_TIDAK)[number];

export const STATUS_AKHBAR = [
  "Belum",
  "Dalam Tindakan",
  "Selesai",
  "Tidak Berkaitan",
] as const;
export type StatusAkhbar = (typeof STATUS_AKHBAR)[number];

export const KATEGORI_SEKOLAH = [
  "SR Luar PKB",
  "SR Dalam PKB",
  "SM Luar PKB",
  "SM Dalam PKB",
] as const;
export type KategoriSekolah = (typeof KATEGORI_SEKOLAH)[number];

export function isYaTidak(v: string): v is YaTidak {
  return (YA_TIDAK as readonly string[]).includes(v);
}

export function isStatusAkhbar(v: string): v is StatusAkhbar {
  return (STATUS_AKHBAR as readonly string[]).includes(v);
}

export function isKategoriSekolah(v: string): v is KategoriSekolah {
  return (KATEGORI_SEKOLAH as readonly string[]).includes(v);
}

/** Parse amaun RM (≥ 0). Terima "1,234.56" atau "1234.56". */
export function parseRm(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim().replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function computeBaki(peruntukan: number, perbelanjaan: number): number {
  return Math.round((peruntukan - perbelanjaan) * 100) / 100;
}
