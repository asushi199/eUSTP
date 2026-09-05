import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { driveViewUrl, uploadFileViaGas } from "@/lib/gas-upload";
import { resolveSuratMime } from "@/lib/khidmat-bantu/surat-mime";
import { db } from "@/lib/db";
import { mediaCards } from "@/lib/schema";
import { buildMediaDrivePath } from "./drive-path";
import { mediaAdminHref, mediaHref } from "./kategori";

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadMediaFileToDrive(opts: {
  kategori: string;
  title: string;
  letterMonth: string;
  file: { name: string; type: string; buffer: Buffer };
}): Promise<{ url: string }> {
  const mime = resolveSuratMime(opts.file.name, opts.file.type);
  if (!mime) {
    throw new Error("Format tidak disokong. Sila muat naik PDF atau imej (JPG/PNG/WebP).");
  }
  if (opts.file.buffer.byteLength > MAX_BYTES) {
    throw new Error("Saiz fail melebihi 8 MB. Sila pilih fail lebih kecil.");
  }

  const { fileName, subPath } = buildMediaDrivePath({
    kategori: opts.kategori,
    letterMonth: opts.letterMonth,
    title: opts.title,
    originalName: opts.file.name,
    mime,
  });
  const uploaded = await uploadFileViaGas(
    { name: opts.file.name, type: mime, buffer: opts.file.buffer },
    { fileName, subPath },
  );
  const url = driveViewUrl(uploaded.path);
  if (!url) {
    throw new Error("Muat naik Drive berjaya tetapi pautan tidak lengkap.");
  }
  return { url };
}

function revalidateMedia(kategori: string) {
  revalidatePath("/admin/media");
  revalidatePath("/media");
  revalidatePath(mediaHref(kategori));
  revalidatePath(mediaAdminHref(kategori));
}

export async function publishMediaLink(opts: {
  kategori: string;
  title: string;
  url: string;
  letterMonth: string;
}): Promise<{ id: number; url: string }> {
  const [row] = await db
    .insert(mediaCards)
    .values({
      kategori: opts.kategori,
      title: opts.title,
      url: opts.url,
      letterMonth: opts.letterMonth,
      aktif: true,
    })
    .returning({ id: mediaCards.id });

  revalidateMedia(opts.kategori);
  return { id: row.id, url: opts.url };
}

export async function updateMediaCardMeta(
  id: number,
  patch: { title?: string; letterMonth?: string },
): Promise<{ ok: true; kategori: string } | { ok: false }> {
  const row = await db.query.mediaCards.findFirst({
    columns: { id: true, kategori: true },
    where: eq(mediaCards.id, id),
  });
  if (!row) return { ok: false };
  await db
    .update(mediaCards)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(mediaCards.id, id));
  revalidateMedia(row.kategori);
  return { ok: true, kategori: row.kategori };
}

export async function removeMediaCard(id: number): Promise<boolean> {
  const row = await db.query.mediaCards.findFirst({
    columns: { id: true, kategori: true },
    where: eq(mediaCards.id, id),
  });
  if (!row) return false;
  await db.delete(mediaCards).where(eq(mediaCards.id, id));
  revalidateMedia(row.kategori);
  return true;
}
