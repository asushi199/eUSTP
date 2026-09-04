import "server-only";

import { revalidatePath } from "next/cache";
import { driveViewUrl, uploadFileViaGas } from "@/lib/gas-upload";
import { resolveSuratMime } from "@/lib/khidmat-bantu/surat-mime";
import { db } from "@/lib/db";
import { resourcesCards } from "@/lib/schema";
import { buildResourcesDrivePath } from "./drive-path";
import { resourcesHref } from "./kategori";

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadResourcesFileToDrive(opts: {
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

  const { fileName, subPath } = buildResourcesDrivePath({
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

export async function publishResourcesFile(opts: {
  kategori: string;
  title: string;
  letterMonth: string;
  file: { name: string; type: string; buffer: Buffer };
}): Promise<{ id: number; url: string }> {
  const { url } = await uploadResourcesFileToDrive(opts);
  const [row] = await db
    .insert(resourcesCards)
    .values({
      kategori: opts.kategori,
      title: opts.title,
      url,
      letterMonth: opts.letterMonth,
      aktif: true,
    })
    .returning({ id: resourcesCards.id });

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  revalidatePath(resourcesHref(opts.kategori));
  return { id: row.id, url };
}
