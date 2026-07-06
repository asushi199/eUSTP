import "server-only";

import { uploadFileViaGas } from "@/lib/gas-upload";
import type { KhidmatSuratPermohonan } from "@/lib/schema";

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function slugForName(value: string, maxLen: number): string {
  const slug = (value || "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return slug || "Unit";
}

function extensionFrom(originalName: string, mime: string): string {
  const dot = originalName.lastIndexOf(".");
  const fromName =
    dot >= 0 ? originalName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  if (fromName) return fromName.slice(0, 5);

  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function buildSuratPermohonanNaming(
  meta: { orgName: string; activityDate: string; serviceType: string },
  originalName: string,
  mime: string,
): { fileName: string; subPath: string[] } {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(meta.activityDate)
    ? new Date(`${meta.activityDate}T12:00:00`)
    : new Date();
  const year = String(d.getFullYear());
  const month = `${year}-${pad2(d.getMonth() + 1)}`;
  const dateStr = `${month}-${pad2(d.getDate())}`;
  const org = slugForName(meta.orgName, 40);
  const service = slugForName(meta.serviceType, 20);
  const ext = extensionFrom(originalName, mime);
  const unique = Date.now().toString(36);
  const fileName = `${dateStr}_${org}_${service}_${unique}.${ext}`;
  return { fileName, subPath: [year, month, "Khidmat-Bantu"] };
}

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
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Format tidak disokong. Sila muat naik PDF atau imej (JPG/PNG/WebP).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { fileName, subPath } = buildSuratPermohonanNaming(meta, file.name, mime);
  const uploaded = await uploadFileViaGas(
    { name: file.name, type: mime, buffer },
    { fileName, subPath },
  );

  return {
    storagePath: uploaded.path,
    fileName,
    originalName: file.name,
  };
}
