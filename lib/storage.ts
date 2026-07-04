/**
 * Storan gambar laporan (DPD/PSS) — backend tunggal: GAS Web App → Google Drive.
 * (Gambar bilik PKG menggunakan Supabase Storage — lihat lib/tempahan.)
 */

import {
  deleteLaporanPhotoViaGas,
  isGasStorageConfigured,
  uploadLaporanPhotoViaGas,
} from "@/lib/gas-upload";
import type { LaporanPhotoMeta } from "@/lib/laporan/photos";

export function isLaporanStorageConfigured(): boolean {
  return isGasStorageConfigured();
}

export async function uploadLaporanPhoto(
  file: { name: string; type: string; buffer: Buffer },
  meta: LaporanPhotoMeta,
): Promise<{ path: string; publicUrl: string }> {
  if (!isGasStorageConfigured()) {
    throw new Error(
      "Muat naik gambar belum tersedia (GAS_WEB_APP_URL belum dikonfigurasi).",
    );
  }
  return uploadLaporanPhotoViaGas(file, meta);
}

/** Padam fail storan selepas rekod DB dipadam — best-effort. */
export async function deleteLaporanPhotoFromStorage(storagePath: string): Promise<boolean> {
  return deleteLaporanPhotoViaGas(storagePath);
}
