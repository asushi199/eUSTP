const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Beberapa pelayar (terutama PDF di Windows) tidak set file.type — infer dari sambungan. */
export function resolveSuratMime(fileName: string, mime: string): string | null {
  const trimmed = mime.trim();
  if (trimmed && ALLOWED_MIME.has(trimmed)) return trimmed;

  const dot = fileName.lastIndexOf(".");
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
  const inferred = EXT_TO_MIME[ext];
  return inferred && ALLOWED_MIME.has(inferred) ? inferred : null;
}

export function isAllowedSuratMime(fileName: string, mime: string): boolean {
  return resolveSuratMime(fileName, mime) !== null;
}
