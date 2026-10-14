import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token gambar bukti MJKD: "drive/{fileId}~{hmac}". Dikeluarkan hanya oleh tindakan muat naik,
 * supaya borang awam tidak boleh merujuk (dan kemudian memadam) fail Drive lain milik akaun GAS.
 */
function rahsia(): string {
  const s = process.env.AUTH_SECRET?.trim() || process.env.GAS_UPLOAD_SECRET?.trim();
  if (!s) throw new Error("AUTH_SECRET belum dikonfigurasi.");
  return s;
}

function hmac(path: string): string {
  return createHmac("sha256", rahsia()).update(`mjkd-foto:${path}`).digest("hex").slice(0, 32);
}

export function tandatanganFoto(path: string): string {
  return `${path}~${hmac(path)}`;
}

/** Path jika token sah; null jika tiada tandatangan atau tandatangan salah. */
export function sahkanTokenFoto(token: string): string | null {
  const i = token.lastIndexOf("~");
  if (i < 0) return null;
  const path = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1));
  const jangka = Buffer.from(hmac(path));
  if (sig.length !== jangka.length || !timingSafeEqual(sig, jangka)) return null;
  return path;
}

/**
 * Tukar token gambar dalam penghantaran kepada path. Path tanpa tandatangan hanya diterima jika
 * sudah ada dalam rekod sedia ada sekolah itu (dihantar semula semasa kemas kini).
 */
export function selesaikanFotoBukti(
  fotoBukti: readonly string[],
  sediaAda: ReadonlySet<string>,
): string[] | null {
  const out: string[] = [];
  for (const f of fotoBukti) {
    const path = f.includes("~") ? sahkanTokenFoto(f) : sediaAda.has(f) ? f : null;
    if (!path) return null;
    if (!out.includes(path)) out.push(path);
  }
  return out;
}
