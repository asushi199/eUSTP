const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MIME_ALIAS: Record<string, string> = {
  "application/x-pdf": "application/pdf",
  "application/acrobat": "application/pdf",
  "application/vnd.pdf": "application/pdf",
  "text/pdf": "application/pdf",
  "image/jpg": "image/jpeg",
};

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function normalizeMime(mime: string): string {
  return mime.trim().toLowerCase().split(";")[0]?.trim() ?? "";
}

/** Beberapa pelayar (terutama PDF di Windows) tidak set file.type — infer dari sambungan. */
export function resolveSuratMime(fileName: string, mime: string): string | null {
  const trimmed = normalizeMime(mime);
  if (trimmed && ALLOWED_MIME.has(trimmed)) {
    return trimmed === "image/jpg" ? "image/jpeg" : trimmed;
  }
  if (trimmed && MIME_ALIAS[trimmed]) return MIME_ALIAS[trimmed];

  const dot = fileName.lastIndexOf(".");
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
  const inferred = EXT_TO_MIME[ext];
  if (inferred) return inferred;

  if (
    !ext &&
    (!trimmed ||
      trimmed === "application/octet-stream" ||
      trimmed === "binary/octet-stream" ||
      trimmed === "application/force-download" ||
      trimmed === "application/download")
  ) {
    return "application/pdf";
  }

  return null;
}

export function isAllowedSuratMime(fileName: string, mime: string): boolean {
  return resolveSuratMime(fileName, mime) !== null;
}
