export function parseBotCommand(
  text: string | undefined,
  botUsername: string,
): string | null {
  const match = text?.trim().match(/^\/([a-zA-Z0-9_]+)(?:@([A-Za-z0-9_]+))?(?:\s|$)/);
  if (!match) return null;
  const mentioned = match[2];
  if (
    mentioned &&
    botUsername &&
    mentioned.toLowerCase() !== botUsername.replace(/^@/, "").toLowerCase()
  ) {
    return null;
  }
  return match[1].toLowerCase();
}

export function parseBotCommandRemainder(text: string | undefined): string {
  return (text ?? "").replace(/^\s*\/[a-zA-Z0-9_]+(?:@[A-Za-z0-9_]+)?\s*/i, "").trim();
}

export const RESOURCE_SEARCH_COMMANDS = new Set(["cari", "carian", "search"]);

export type ResourceCallback =
  | { type: "kategori"; slug: "surat-ustp" | "surat-sekolah" }
  | { type: "bulan"; month: string }
  | { type: "tahun"; center: string }
  | { type: "batal" };

export function parseResourceCallback(data: string | undefined): ResourceCallback | null {
  if (!data) return null;
  if (data === "rs:x") return { type: "batal" };
  const kategori = /^rs:k:(surat-ustp|surat-sekolah)$/.exec(data);
  if (kategori) {
    return { type: "kategori", slug: kategori[1] as "surat-ustp" | "surat-sekolah" };
  }
  const month = /^rs:m:(\d{4}-\d{2})$/.exec(data);
  if (month) return { type: "bulan", month: month[1] };
  const year = /^rs:y:(\d{4}-\d{2})$/.exec(data);
  if (year) return { type: "tahun", center: year[1] };
  return null;
}

export function resourceKategoriCallbackData(slug: "surat-ustp" | "surat-sekolah"): string {
  return `rs:k:${slug}`;
}

export function resourceMonthCallbackData(month: string): string {
  return `rs:m:${month}`;
}

export function resourceYearCallbackData(center: string): string {
  return `rs:y:${center}`;
}

export const RESOURCE_CANCEL_CALLBACK = "rs:x";
