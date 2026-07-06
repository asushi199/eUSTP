import "server-only";

import { uploadSuratBuffer } from "@/lib/khidmat-bantu/surat-storage";
import { resolveSuratMime } from "@/lib/khidmat-bantu/surat-mime";
import type { KhidmatSuratPermohonan } from "@/lib/schema";

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadSuratPermohonan(
  file: File,
  meta: { orgName: string; activityDate: string; serviceType: string },
): Promise<KhidmatSuratPermohonan> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Sila muat naik surat permohonan.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Surat permohonan melebihi 8 MB. Sila pilih fail lebih kecil.");
  }
  const mime = resolveSuratMime(file.name, file.type || "");
  if (!mime) {
    throw new Error("Format tidak disokong. Sila muat naik PDF atau imej (JPG/PNG/WebP).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadSuratBuffer(
    { name: file.name, type: mime, buffer },
    meta,
  );

  return {
    storagePath: uploaded.storagePath,
    fileName: uploaded.fileName,
    originalName: file.name,
  };
}
