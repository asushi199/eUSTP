import "server-only";

import { driveViewUrl, uploadFileViaGas } from "@/lib/gas-upload";
import { resolveSuratMime } from "@/lib/khidmat-bantu/surat-mime";
import { buildMediaDrivePath } from "./drive-path";

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
