import "server-only";

import { finalizeDriveFileViaGas, initResumableViaGas } from "@/lib/gas-upload";
import { resolveSuratMime } from "@/lib/khidmat-bantu/surat-mime";
import { buildSuratPermohonanNaming } from "@/lib/khidmat-bantu/surat-permohonan-naming";
import { SURAT_CHUNK_BYTES, SURAT_MAX_BYTES, SURAT_MAX_LABEL } from "@/lib/khidmat-bantu/surat-limits";
import type { KhidmatSuratPermohonan } from "@/lib/schema";

/** Mulakan sesi resumable Drive untuk surat besar. */
export async function startSuratResumable(
  meta: { orgName: string; activityDate: string; serviceType: string },
  file: { name: string; type: string; size: number },
): Promise<{ sessionUri: string; fileName: string }> {
  if (!Number.isFinite(file.size) || file.size <= 0) throw new Error("Fail tidak sah.");
  if (file.size > SURAT_MAX_BYTES) {
    throw new Error(`Surat permohonan melebihi ${SURAT_MAX_LABEL}. Sila pilih fail lebih kecil.`);
  }
  const mime = resolveSuratMime(file.name, file.type);
  if (!mime) {
    throw new Error("Format tidak disokong. Sila muat naik PDF atau imej (JPG/PNG/WebP).");
  }
  const { fileName, subPath } = buildSuratPermohonanNaming(meta, file.name, mime);
  const sessionUri = await initResumableViaGas({ fileName, subPath }, { type: mime, size: file.size });
  return { sessionUri, fileName };
}

/** Hanya terima URI sesi resumable Drive (elak relay ke hos lain / SSRF). */
export function isDriveSessionUri(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "www.googleapis.com" &&
      u.pathname.startsWith("/upload/drive/v3/files") &&
      u.searchParams.has("upload_id")
    );
  } catch {
    return false;
  }
}

export type SuratChunkResult =
  | { ok: false; error: string; retryable?: boolean }
  | { ok: true; done: false; next: number }
  | { ok: true; done: true; surat: KhidmatSuratPermohonan };

/** PUT satu ketul ke sesi Drive; ketul terakhir → finalize + pulangkan metadata surat. */
export async function relaySuratChunk(args: {
  sessionUri: string;
  start: number;
  total: number;
  chunk: Uint8Array;
  fileName: string;
  originalName: string;
}): Promise<SuratChunkResult> {
  const { sessionUri, start, total, chunk, fileName, originalName } = args;
  const end = start + chunk.byteLength; // eksklusif
  if (chunk.byteLength === 0 || chunk.byteLength > SURAT_CHUNK_BYTES) {
    return { ok: false, error: "Saiz ketul tidak sah." };
  }
  if (total <= 0 || total > SURAT_MAX_BYTES || start < 0 || end > total) {
    return { ok: false, error: "Julat ketul tidak sah." };
  }

  let res: Response;
  try {
    res = await fetch(sessionUri, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes ${start}-${end - 1}/${total}`,
        "Content-Type": "application/octet-stream",
      },
      body: chunk as BodyInit,
      redirect: "manual",
      signal: AbortSignal.timeout(50_000),
    });
  } catch {
    return { ok: false, error: "Tidak dapat menghubungi Google Drive.", retryable: true };
  }

  if (res.status === 308) {
    // Range: bytes=0-N → N+1 bait telah disimpan. Tiada Range → belum ada bait diterima.
    const m = /bytes=0-(\d+)/.exec(res.headers.get("range") ?? "");
    return { ok: true, done: false, next: m ? Number(m[1]) + 1 : 0 };
  }

  if (res.status === 200 || res.status === 201) {
    const json = (await res.json().catch(() => null)) as { id?: string } | null;
    if (!json?.id) return { ok: false, error: "Google Drive tidak memulangkan id fail." };
    try {
      const storagePath = await finalizeDriveFileViaGas(json.id);
      return { ok: true, done: true, surat: { storagePath, fileName, originalName } };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Gagal menyiapkan fail di Drive.",
        retryable: true,
      };
    }
  }

  // 404/410 = sesi tamat/tidak sah → tidak boleh dicuba semula; 5xx = sementara.
  return {
    ok: false,
    error: `Google Drive menolak ketul (HTTP ${res.status}).`,
    retryable: res.status >= 500,
  };
}
