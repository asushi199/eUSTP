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

export const RESOURCE_SEARCH_COMMANDS = new Set([
  "cari",
  "carian",
  "search",
  "ustp",
  "surat_ustp",
  "sekolah",
  "surat_sekolah",
  "spi",
  "pekeliling",
  "nota",
]);

export const RESOURCE_MANAGE_COMMANDS = new Set(["kemaskini", "padam"]);
export const RESOURCE_HELP_COMMANDS = new Set(["mula"]);
export const MEDIA_FOTO_COMMANDS = new Set(["foto", "gambar"]);
export const MEDIA_FOTO_KATEGORI = "koleksi";

export type MediaFotoCallback =
  | { type: "guna_tajuk" }
  | { type: "ubah_tajuk"; cardId: number }
  | { type: "ubah_bulan"; cardId: number }
  | { type: "padam"; cardId: number }
  | { type: "padam_ya"; cardId: number };

export type ResourceCallback =
  | { type: "kategori"; slug: "surat-ustp" | "surat-sekolah" }
  | { type: "bulan"; month: string }
  | { type: "tahun"; center: string }
  | { type: "ubah_tajuk"; cardId: number }
  | { type: "ubah_bulan"; cardId: number }
  | { type: "padam"; cardId: number }
  | { type: "padam_ya"; cardId: number }
  | { type: "batal" };

function parseCardId(raw: string | undefined): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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
  const padamYa = /^rs:dy:(\d+)$/.exec(data);
  if (padamYa) {
    const cardId = parseCardId(padamYa[1]);
    return cardId ? { type: "padam_ya", cardId } : null;
  }
  const padam = /^rs:d:(\d+)$/.exec(data);
  if (padam) {
    const cardId = parseCardId(padam[1]);
    return cardId ? { type: "padam", cardId } : null;
  }
  const ubahTajuk = /^rs:et:(\d+)$/.exec(data);
  if (ubahTajuk) {
    const cardId = parseCardId(ubahTajuk[1]);
    return cardId ? { type: "ubah_tajuk", cardId } : null;
  }
  const ubahBulan = /^rs:eb:(\d+)$/.exec(data);
  if (ubahBulan) {
    const cardId = parseCardId(ubahBulan[1]);
    return cardId ? { type: "ubah_bulan", cardId } : null;
  }
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

export function resourceEditTitleCallbackData(cardId: number): string {
  return `rs:et:${cardId}`;
}

export function resourceEditMonthCallbackData(cardId: number): string {
  return `rs:eb:${cardId}`;
}

export function resourceDeleteCallbackData(cardId: number): string {
  return `rs:d:${cardId}`;
}

export function resourceDeleteConfirmCallbackData(cardId: number): string {
  return `rs:dy:${cardId}`;
}

export function draftCardIdFromFileId(fileId: string | null | undefined): number | null {
  const match = /^card:(\d+)$/.exec(fileId ?? "");
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function draftFileIdForCard(cardId: number): string {
  return `card:${cardId}`;
}

export const MEDIA_USE_TITLE_CALLBACK = "mf:use";

export function parseMediaFotoCallback(data: string | undefined): MediaFotoCallback | null {
  if (!data) return null;
  if (data === MEDIA_USE_TITLE_CALLBACK) return { type: "guna_tajuk" };
  const padamYa = /^mf:dy:(\d+)$/.exec(data);
  if (padamYa) {
    const cardId = parseCardId(padamYa[1]);
    return cardId ? { type: "padam_ya", cardId } : null;
  }
  const padam = /^mf:d:(\d+)$/.exec(data);
  if (padam) {
    const cardId = parseCardId(padam[1]);
    return cardId ? { type: "padam", cardId } : null;
  }
  const ubahTajuk = /^mf:et:(\d+)$/.exec(data);
  if (ubahTajuk) {
    const cardId = parseCardId(ubahTajuk[1]);
    return cardId ? { type: "ubah_tajuk", cardId } : null;
  }
  const ubahBulan = /^mf:eb:(\d+)$/.exec(data);
  if (ubahBulan) {
    const cardId = parseCardId(ubahBulan[1]);
    return cardId ? { type: "ubah_bulan", cardId } : null;
  }
  return null;
}

export function mediaEditTitleCallbackData(cardId: number): string {
  return `mf:et:${cardId}`;
}

export function mediaEditMonthCallbackData(cardId: number): string {
  return `mf:eb:${cardId}`;
}

export function mediaDeleteCallbackData(cardId: number): string {
  return `mf:d:${cardId}`;
}

export function mediaDeleteConfirmCallbackData(cardId: number): string {
  return `mf:dy:${cardId}`;
}

export function draftMediaCardIdFromFileId(fileId: string | null | undefined): number | null {
  const match = /^mcard:(\d+)$/.exec(fileId ?? "");
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function draftFileIdForMediaCard(cardId: number): string {
  return `mcard:${cardId}`;
}

export function isFotoDraftStep(step: string): boolean {
  return step.startsWith("foto_");
}
