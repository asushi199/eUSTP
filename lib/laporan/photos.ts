/** Had gambar setiap laporan (DPD & PSS). */
export const LAPORAN_MAX_PHOTOS = 5;

export type LaporanModul = "dpd" | "pss";

/** Metadata susun atur & nama fail gambar laporan di Google Drive. */
export type LaporanPhotoMeta = {
  modul: LaporanModul;
  laporanId: number;
  /** tarikh program — untuk folder Tahun / Bulan */
  tarikh: Date | string;
  /** nama program — diringkaskan menjadi slug nama fail */
  program: string;
  /** nombor urutan gambar (1..n) */
  index?: number;
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function slugForName(value: string, maxLen: number): string {
  const slug = (value || "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, maxLen);
  return slug || "NA";
}

/**
 * Nama fail self-describing + subfolder Tahun / Bulan / Modul.
 * Cth: 2026-07-04_DPD12_BENGKEL-DELIMA_2_lqx3.jpg → 2026/2026-07/DPD/
 */
export function buildLaporanPhotoNaming(
  meta: LaporanPhotoMeta,
  originalName: string,
): { fileName: string; subPath: string[] } {
  const d = meta.tarikh instanceof Date ? meta.tarikh : new Date(meta.tarikh);
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const year = String(safeDate.getFullYear());
  const month = `${year}-${pad2(safeDate.getMonth() + 1)}`;
  const dateStr = `${month}-${pad2(safeDate.getDate())}`;
  const modul = meta.modul.toUpperCase();
  const program = slugForName(meta.program, 28);
  const dot = originalName.lastIndexOf(".");
  const ext =
    (dot >= 0 ? originalName.slice(dot + 1) : "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 5) || "jpg";
  const idx = meta.index ? `_${meta.index}` : "";
  const unique = Date.now().toString(36);
  const fileName = `${dateStr}_${modul}${meta.laporanId}_${program}${idx}_${unique}.${ext}`;
  const subPath = [year, month, modul];
  return { fileName, subPath };
}

export const LAPORAN_IMAGE_MAX_EDGE_PX = 1920;
export const LAPORAN_IMAGE_JPEG_QUALITY = 0.82;
/** Sasaran saiz selepas mampatan (kurangkan beban GAS). */
export const LAPORAN_IMAGE_TARGET_MAX_BYTES = 1_200_000;
/** Fail kecil tidak perlu dimampatkan semula. */
export const LAPORAN_IMAGE_SKIP_COMPRESS_BELOW_BYTES = 450_000;
