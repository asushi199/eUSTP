import { resolveSuratMime } from "@/lib/khidmat-bantu/surat-mime";

export type TelegramResourceFile = {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
};

export type TelegramFileSource = {
  document?: {
    file_id?: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
  photo?: Array<{ file_id?: string; file_size?: number }>;
  reply_to_message?: TelegramFileSource;
};

function hasExtension(name: string): boolean {
  return /\.[a-z0-9]{1,8}$/i.test(name);
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

/** Telegram kerap hantar PDF tanpa sambungan fail + mime octet-stream. */
export function normalizeTelegramDocumentName(fileName: string, mime: string): string {
  const name = fileName.trim() || "surat";
  if (hasExtension(name)) return name;
  const lower = mime.trim().toLowerCase().split(";")[0]?.trim() ?? "";
  if (isImageMime(lower) || lower === "image/jpg") return `${name}.jpg`;
  if (lower === "image/png") return `${name}.png`;
  if (lower === "image/webp") return `${name}.webp`;
  return `${name}.pdf`;
}

function fromDocumentOrPhoto(message: TelegramFileSource): TelegramResourceFile | null {
  const doc = message.document;
  if (doc?.file_id) {
    const fileName = normalizeTelegramDocumentName(doc.file_name ?? "", doc.mime_type ?? "");
    const mimeType = doc.mime_type || "";
    return {
      fileId: doc.file_id,
      fileName,
      mimeType: resolveSuratMime(fileName, mimeType) ?? mimeType,
      fileSize: typeof doc.file_size === "number" ? doc.file_size : null,
    };
  }
  const photos = message.photo;
  if (photos?.length) {
    const largest = photos[photos.length - 1];
    if (!largest?.file_id) return null;
    return {
      fileId: largest.file_id,
      fileName: "surat.jpg",
      mimeType: "image/jpeg",
      fileSize: typeof largest.file_size === "number" ? largest.file_size : null,
    };
  }
  return null;
}

/** Ambil fail pada mesej, atau pada mesej yang dibalas (cth. PDF lalu /surat). */
export function extractTelegramResourceFile(
  message: TelegramFileSource,
  opts: { includeReply?: boolean } = {},
): TelegramResourceFile | null {
  return (
    fromDocumentOrPhoto(message) ??
    (opts.includeReply && message.reply_to_message
      ? fromDocumentOrPhoto(message.reply_to_message)
      : null)
  );
}
