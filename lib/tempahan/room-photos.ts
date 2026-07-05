/**
 * Gambar bilik & logo PKG — Supabase Storage (bucket awam "room-photos").
 * Berbeza dengan gambar laporan (Google Drive) kerana bilangan kecil dan statik.
 */

export function isRoomPhotoStorageConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Buang petik/ruang/newline yang tersalin bersama nilai env (punca "Invalid Compact JWS"). */
function cleanEnv(value: string | undefined): string {
  let v = (value ?? "").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

async function uploadObject(
  path: string,
  file: { name: string; type: string; buffer: Buffer },
  errorLabel: string,
): Promise<string> {
  const base = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/$/, "");
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = cleanEnv(process.env.SUPABASE_STORAGE_BUCKET) || "room-photos";
  if (!base || !key) {
    throw new Error("Supabase Storage belum dikonfigurasi (URL + SERVICE_ROLE_KEY).");
  }
  // service_role Storage ialah JWT (eyJ...). Kunci baharu sb_secret_... tidak diterima.
  if (!key.startsWith("eyJ")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY bukan kunci JWT service_role (patut bermula 'eyJ'). " +
        "Salin kunci 'service_role' (legacy JWT) dari Supabase → Settings → API.",
    );
  }

  const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: new Uint8Array(file.buffer),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${errorLabel} gagal: ${err}`);
  }

  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

function extOf(filename: string): string {
  return (
    filename
      .slice(filename.lastIndexOf(".") + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 5) || "jpg"
  );
}

export async function uploadRoomPhoto(
  pkgId: string,
  roomSlug: string,
  file: { name: string; type: string; buffer: Buffer },
): Promise<string> {
  const path = `${pkgId}/${roomSlug}-${Date.now()}.${extOf(file.name)}`;
  return uploadObject(path, file, "Muat naik gambar bilik");
}

export async function uploadPkgLogo(
  pkgId: string,
  file: { name: string; type: string; buffer: Buffer },
): Promise<string> {
  const path = `${pkgId}/logo-${Date.now()}.${extOf(file.name)}`;
  return uploadObject(path, file, "Muat naik logo PKG");
}
