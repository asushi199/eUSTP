import { isLetterMonthKey } from "@/lib/resources/drive-path";
import { MEDIA_DRIVE_FOLDER } from "./kategori";

export { isLetterMonthKey };

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

export function sanitizeMediaFileName(
  title: string,
  originalName: string,
  mime: string,
): string {
  const ext = extensionFrom(originalName, mime);
  const base = title
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${base || "Media"}.${ext}`;
}

/** Folder Drive: CoE-Media / kumpulan / tahun / YYYY-MM */
export function buildMediaDrivePath(opts: {
  kategori: string;
  letterMonth: string;
  title: string;
  originalName: string;
  mime: string;
}): { fileName: string; subPath: string[] } {
  const year = opts.letterMonth.slice(0, 4);
  const group = MEDIA_DRIVE_FOLDER[opts.kategori] ?? opts.kategori;
  return {
    fileName: sanitizeMediaFileName(opts.title, opts.originalName, opts.mime),
    subPath: ["CoE-Media", group, year, opts.letterMonth],
  };
}
