/**
 * Muat naik gambar laporan melalui Google Apps Script Web App
 * (tanpa Service Account JSON — sesuai untuk persekitaran MOE).
 */

import { buildLaporanPhotoNaming, type LaporanPhotoMeta } from "@/lib/laporan/photos";

const MAX_BYTES = 8 * 1024 * 1024; // elak timeout GAS
/** GAS Web App (terutama cold start) boleh >10s; padankan maxDuration halaman. */
const GAS_FETCH_TIMEOUT_MS = 55_000;

export function isGasStorageConfigured(): boolean {
  return !!(
    process.env.GAS_WEB_APP_URL?.trim() && process.env.GAS_UPLOAD_SECRET?.trim()
  );
}

export async function uploadFileViaGas(
  file: { name: string; type: string; buffer: Buffer },
  opts: { fileName: string; subPath: string[] },
): Promise<{ path: string; publicUrl: string }> {
  const url = process.env.GAS_WEB_APP_URL?.trim();
  const secret = process.env.GAS_UPLOAD_SECRET?.trim();
  if (!url || !secret) {
    throw new Error(
      "GAS belum dikonfigurasi: set GAS_WEB_APP_URL dan GAS_UPLOAD_SECRET dalam .env.local.",
    );
  }

  if (file.buffer.byteLength > MAX_BYTES) {
    throw new Error("Saiz fail melebihi 8 MB. Sila pilih fail lebih kecil.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GAS_FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        fileName: opts.fileName,
        subPath: opts.subPath,
        mimeType: file.type || "application/octet-stream",
        dataBase64: file.buffer.toString("base64"),
      }),
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Muat naik mengambil masa terlalu lama (GAS tidak membalas dalam 55 saat). " +
          "Fail mungkin sudah ada di Google Drive — sila cuba sekali lagi atau hubungi admin USTP.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json: {
    ok?: boolean;
    error?: string;
    path?: string;
    publicUrl?: string;
    fileId?: string;
  };

  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(
      `GAS tidak memulangkan JSON (HTTP ${res.status}). Semak URL Web App dan deploy "Execute as: Me".`,
    );
  }

  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Muat naik GAS gagal (HTTP ${res.status})`);
  }

  if (!json.publicUrl || !json.path) {
    throw new Error("Respons GAS tidak lengkap (tiada publicUrl/path).");
  }

  return { path: json.path, publicUrl: json.publicUrl };
}

export async function uploadLaporanPhotoViaGas(
  file: { name: string; type: string; buffer: Buffer },
  meta: LaporanPhotoMeta,
): Promise<{ path: string; publicUrl: string }> {
  const { fileName, subPath } = buildLaporanPhotoNaming(meta, file.name);
  return uploadFileViaGas(file, { fileName, subPath });
}

async function callGas<T extends { ok?: boolean; error?: string }>(
  body: Record<string, unknown>,
  timeoutMs = 20_000,
): Promise<T> {
  const url = process.env.GAS_WEB_APP_URL?.trim();
  const secret = process.env.GAS_UPLOAD_SECRET?.trim();
  if (!url || !secret) {
    throw new Error("GAS belum dikonfigurasi: set GAS_WEB_APP_URL dan GAS_UPLOAD_SECRET.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, ...body }),
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await res.text();
    let json: T;
    try {
      json = JSON.parse(text) as T;
    } catch {
      throw new Error(`GAS tidak memulangkan JSON (HTTP ${res.status}).`);
    }
    if (!res.ok || !json.ok) throw new Error(json.error || `GAS gagal (HTTP ${res.status})`);
    return json;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("GAS tidak membalas tepat pada masanya. Sila cuba sekali lagi.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Minta GAS cipta sesi resumable Drive (muat naik berketul — tiada had 4.5 MB Vercel).
 * Memerlukan GAS yang menyokong action "initResumable" (lihat gas/Code.gs).
 */
export async function initResumableViaGas(
  opts: { fileName: string; subPath: string[] },
  file: { type: string; size: number },
): Promise<string> {
  const json = await callGas<{ ok?: boolean; error?: string; sessionUri?: string }>({
    action: "initResumable",
    fileName: opts.fileName,
    subPath: opts.subPath,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  });
  if (!json.sessionUri) throw new Error("GAS tidak memulangkan sessionUri.");
  return json.sessionUri;
}

/** Selepas ketul terakhir: tetapkan perkongsian fail Drive melalui GAS. */
export async function finalizeDriveFileViaGas(fileId: string): Promise<string> {
  const json = await callGas<{ ok?: boolean; error?: string; path?: string }>({
    action: "finalize",
    fileId,
  });
  return json.path ?? `drive/${fileId}`;
}

/** id Drive daripada storagePath "drive/{fileId}". */
export function driveFileIdFromPath(storagePath: string): string | null {
  const m = /^drive\/(.+)$/.exec(storagePath);
  return m ? m[1] : null;
}

/** Pautan paparan fail Drive (PDF / dokumen). */
export function driveViewUrl(storagePath: string): string | null {
  const fileId = driveFileIdFromPath(storagePath);
  return fileId ? `https://drive.google.com/file/d/${fileId}/view` : null;
}

/**
 * Padam (trash) fail Drive melalui GAS — best-effort, tidak melontar ralat.
 * Dipanggil selepas baris DB dipadam supaya storan tidak menimbun fail yatim.
 */
export async function deleteLaporanPhotoViaGas(storagePath: string): Promise<boolean> {
  const url = process.env.GAS_WEB_APP_URL?.trim();
  const secret = process.env.GAS_UPLOAD_SECRET?.trim();
  const fileId = driveFileIdFromPath(storagePath);
  if (!url || !secret || !fileId) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action: "delete", fileId }),
      redirect: "follow",
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return !!(res.ok && json?.ok);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
