import { NextResponse } from "next/server";
import { SURAT_CHUNK_BYTES } from "@/lib/khidmat-bantu/surat-limits";
import { isDriveSessionUri, relaySuratChunk } from "@/lib/khidmat-bantu/surat-resumable";

/**
 * Relay satu ketul surat permohonan (≤ 3 MiB, di bawah had badan 4.5 MB Vercel)
 * ke sesi resumable Google Drive. Awam seperti borang Khidmat Bantu — sesi hanya
 * boleh dicipta oleh startSuratResumableAction dan URI divalidasi (hos Google sahaja).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function intParam(params: URLSearchParams, key: string): number {
  const n = Number(params.get(key));
  return Number.isInteger(n) ? n : -1;
}

export async function POST(req: Request) {
  const params = new URL(req.url).searchParams;
  const sessionUri = params.get("s") ?? "";
  const start = intParam(params, "start");
  const total = intParam(params, "total");
  const fileName = (params.get("fileName") ?? "").slice(0, 300);
  const originalName = (params.get("originalName") ?? "").slice(0, 300);

  if (!isDriveSessionUri(sessionUri) || !fileName || !originalName) {
    return NextResponse.json({ ok: false, error: "Permintaan tidak sah." }, { status: 400 });
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > SURAT_CHUNK_BYTES) {
    return NextResponse.json({ ok: false, error: "Ketul terlalu besar." }, { status: 413 });
  }

  const chunk = new Uint8Array(await req.arrayBuffer());
  const result = await relaySuratChunk({ sessionUri, start, total, chunk, fileName, originalName });
  return NextResponse.json(result, { status: result.ok ? 200 : result.retryable ? 502 : 400 });
}
