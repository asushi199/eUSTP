import { startSuratResumableAction } from "@/lib/actions/khidmat-bantu";
import { SURAT_CHUNK_BYTES } from "@/lib/khidmat-bantu/surat-limits";
import type { KhidmatSuratPermohonan } from "@/lib/schema";

type ChunkResponse =
  | { ok: false; error: string; retryable?: boolean }
  | { ok: true; done: false; next: number }
  | { ok: true; done: true; surat: KhidmatSuratPermohonan };

const MAX_ATTEMPTS = 3;

async function sendChunk(url: string, body: Blob): Promise<ChunkResponse> {
  let lastError = "Gagal memuat naik ketul fail.";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body,
      });
      const json = (await res.json().catch(() => null)) as ChunkResponse | null;
      if (json?.ok) return json;
      if (json && !json.ok) {
        if (!json.retryable) return json;
        lastError = json.error;
      } else {
        lastError = `Pelayan tidak membalas dengan betul (HTTP ${res.status}).`;
      }
    } catch {
      lastError = "Sambungan terputus semasa memuat naik. Semak internet anda.";
    }
    if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 800 * attempt));
  }
  return { ok: false, error: lastError };
}

/**
 * Muat naik surat besar berketul: Server Action cipta sesi Drive, kemudian setiap
 * ketul (≤ 3 MiB) dihantar ke /api/khidmat-bantu/surat-chunk → Drive. Elak had 4.5 MB Vercel.
 */
export async function uploadSuratChunked(
  file: File,
  meta: { orgName: string; activityDate: string; serviceType: string },
  onProgress?: (fraction: number) => void,
): Promise<{ ok: false; error: string } | { ok: true; surat: KhidmatSuratPermohonan }> {
  const started = await startSuratResumableAction({
    ...meta,
    fileName: file.name,
    fileType: file.type,
    size: file.size,
  });
  if (!started.ok) return started;

  const base = new URLSearchParams({
    s: started.sessionUri,
    total: String(file.size),
    fileName: started.fileName,
    originalName: file.name,
  });

  let offset = 0;
  while (offset < file.size) {
    const end = Math.min(offset + SURAT_CHUNK_BYTES, file.size);
    const params = new URLSearchParams(base);
    params.set("start", String(offset));
    const result = await sendChunk(
      `/api/khidmat-bantu/surat-chunk?${params.toString()}`,
      file.slice(offset, end),
    );
    if (!result.ok) return result;
    if (result.done) {
      onProgress?.(1);
      return { ok: true, surat: result.surat };
    }
    if (result.next <= offset) {
      return { ok: false, error: "Google Drive tidak menerima ketul fail. Sila cuba lagi." };
    }
    offset = result.next;
    onProgress?.(Math.min(offset / file.size, 0.99));
  }
  return { ok: false, error: "Muat naik tidak lengkap. Sila cuba lagi." };
}
