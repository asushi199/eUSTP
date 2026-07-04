/**
 * Gambar bilik PKG — Supabase Storage (bucket awam "room-photos").
 * Berbeza dengan gambar laporan (Google Drive) kerana bilangan kecil dan statik.
 */

export function isRoomPhotoStorageConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function uploadRoomPhoto(
  pkgId: string,
  roomSlug: string,
  file: { name: string; type: string; buffer: Buffer },
): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "room-photos";
  if (!base || !key) {
    throw new Error("Supabase Storage belum dikonfigurasi (URL + SERVICE_ROLE_KEY).");
  }

  const ext =
    file.name
      .slice(file.name.lastIndexOf(".") + 1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 5) || "jpg";
  const path = `${pkgId}/${roomSlug}-${Date.now()}.${ext}`;

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
    throw new Error(`Muat naik gambar bilik gagal: ${err}`);
  }

  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
