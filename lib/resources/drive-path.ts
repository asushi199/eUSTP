import { RESOURCES_DRIVE_FOLDER } from "./kategori";

const MONTH_KEY = /^\d{4}-\d{2}$/;

export function isLetterMonthKey(value: string): boolean {
  if (!MONTH_KEY.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
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

export function sanitizeResourcesFileName(
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
  return `${base || "Surat"}.${ext}`;
}

/** Folder Drive: CoE-Resources / kumpulan / tahun / YYYY-MM */
export function buildResourcesDrivePath(opts: {
  kategori: string;
  letterMonth: string;
  title: string;
  originalName: string;
  mime: string;
}): { fileName: string; subPath: string[] } {
  const year = opts.letterMonth.slice(0, 4);
  const group = RESOURCES_DRIVE_FOLDER[opts.kategori] ?? opts.kategori;
  return {
    fileName: sanitizeResourcesFileName(opts.title, opts.originalName, opts.mime),
    subPath: ["CoE-Resources", group, year, opts.letterMonth],
  };
}
