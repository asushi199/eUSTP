import "server-only";

import { uploadFileViaGas } from "@/lib/gas-upload";
import { resolveSuratMime } from "@/lib/khidmat-bantu/surat-mime";
import { buildSuratPermohonanNaming } from "@/lib/khidmat-bantu/surat-permohonan-naming";

const MAX_BYTES = 8 * 1024 * 1024;

/** Muat naik surat ke Google Drive melalui GAS (jauhkan dari kuota Supabase 1 GB). */
export async function uploadSuratBuffer(
  file: { name: string; type: string; buffer: Buffer },
  meta: { orgName: string; activityDate: string; serviceType: string },
): Promise<{ storagePath: string; fileName: string }> {
  if (file.buffer.byteLength > MAX_BYTES) {
    throw new Error("Surat permohonan melebihi 8 MB. Sila pilih fail lebih kecil.");
  }

  const mime = resolveSuratMime(file.name, file.type);
  if (!mime) {
    throw new Error("Format tidak disokong. Sila muat naik PDF atau imej (JPG/PNG/WebP).");
  }

  const { fileName, subPath } = buildSuratPermohonanNaming(meta, file.name, mime);
  const uploaded = await uploadFileViaGas(
    { name: file.name, type: mime, buffer: file.buffer },
    { fileName, subPath },
  );
  return { storagePath: uploaded.path, fileName };
}

/** Pautan paparan surat Drive (storagePath: drive/{fileId}). */
export function suratPermohonanViewUrl(storagePath: string): string | null {
  const m = /^drive\/(.+)$/.exec(storagePath);
  return m ? `https://drive.google.com/file/d/${m[1]}/view` : null;
}
