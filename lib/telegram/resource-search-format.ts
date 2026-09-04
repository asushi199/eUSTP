import { resourcesKategoriBySlug } from "@/lib/resources/kategori";
import {
  formatResourceMonthLabel,
  resourceMonthKey,
  type ResourcesExplorerCard,
} from "@/lib/resources/search";

export const RESOURCE_SEARCH_LIMIT = 8;
export const RESOURCE_SEARCH_MAX_PAGE = 99;
export const RESOURCE_MANAGE_LIMIT = 5;

const GENERIC_SEARCH_COMMANDS = new Set(["cari", "carian", "search"]);

const KATEGORI_BY_COMMAND: Record<string, string> = {
  ustp: "surat-ustp",
  surat_ustp: "surat-ustp",
  sekolah: "surat-sekolah",
  surat_sekolah: "surat-sekolah",
  spi: "pekeliling",
  pekeliling: "pekeliling",
  nota: "nota",
};

const KATEGORI_ALIASES: Record<string, string> = {
  ...KATEGORI_BY_COMMAND,
  "surat-ustp": "surat-ustp",
  suratustp: "surat-ustp",
  "surat-sekolah": "surat-sekolah",
  suratsekolah: "surat-sekolah",
  siaran: "pekeliling",
  modul: "nota",
  panduan: "nota",
};

const KATEGORI_CODE: Record<string, string> = {
  "surat-ustp": "u",
  "surat-sekolah": "s",
  pekeliling: "p",
  nota: "n",
};

const CODE_KATEGORI: Record<string, string | null> = {
  a: null,
  u: "surat-ustp",
  s: "surat-sekolah",
  p: "pekeliling",
  n: "nota",
};

const KATEGORI_SHORT_LABEL: Record<string, string> = {
  "surat-ustp": "Surat USTP",
  "surat-sekolah": "Surat Sekolah",
  pekeliling: "SPI / Pekeliling",
  nota: "Nota / Modul",
};

export type ResourceSearchIntent = {
  help: boolean;
  kategori: string | null;
  query: string;
};

export type ResourceSearchCallback = {
  page: number;
  kategori: string | null;
  query: string;
};

export type ResourceSearchHit = Pick<
  ResourcesExplorerCard,
  "title" | "url" | "kategoriTitle" | "createdAt"
> & {
  id?: number;
  letterMonth?: string | null;
};

export function resourceSearchKategoriLabel(slug: string | null): string {
  if (!slug) return "";
  return KATEGORI_SHORT_LABEL[slug] ?? resourcesKategoriBySlug(slug)?.title ?? slug;
}

export function parseResourceSearchIntent(command: string, remainder: string): ResourceSearchIntent {
  const fromCommand = KATEGORI_BY_COMMAND[command];
  if (fromCommand) {
    return { help: false, kategori: fromCommand, query: remainder.trim() };
  }
  if (!GENERIC_SEARCH_COMMANDS.has(command)) {
    return { help: true, kategori: null, query: "" };
  }
  const trimmed = remainder.trim();
  if (!trimmed) return { help: true, kategori: null, query: "" };
  const tokens = trimmed.split(/\s+/);
  const alias = KATEGORI_ALIASES[tokens[0]?.toLowerCase() ?? ""];
  if (alias) {
    return { help: false, kategori: alias, query: tokens.slice(1).join(" ") };
  }
  return { help: false, kategori: null, query: trimmed };
}

export function resourceSearchHelpText(): string {
  return [
    "Carian CoE Resources — surat terkini dipaparkan dahulu.",
    "",
    "Semua kumpulan:",
    "/cari eduspark",
    "/cari jun 2026",
    "",
    "Ikut kumpulan:",
    "/ustp atau /surat_ustp — surat program USTP",
    "/sekolah atau /surat_sekolah — surat sekolah / guru / murid",
    "/spi — pekeliling / SPI",
    "/nota — nota / modul",
    "",
    "Contoh: /sekolah eduspark atau /cari spi 2026",
    "Jika banyak keputusan, tekan « » untuk muka seterusnya.",
  ].join("\n");
}

export function nexaBotHelpText(): string {
  return [
    "NexaBot — CoE Resources",
    "",
    "Carian: /cari eduspark",
    "Kumpulan: /ustp  /sekolah  /spi  /nota",
    "",
    "Muat naik: /surat",
    "Ubah tajuk atau bulan: /kemaskini",
    "Padam: /padam",
    "Batal: /batal",
  ].join("\n");
}

export function compareResourceCardsNewestFirst(a: ResourceSearchHit, b: ResourceSearchHit): number {
  const monthA = a.letterMonth || resourceMonthKey(a.createdAt) || "";
  const monthB = b.letterMonth || resourceMonthKey(b.createdAt) || "";
  if (monthA !== monthB) return monthB.localeCompare(monthA);
  if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt);
  return (b.id ?? 0) - (a.id ?? 0);
}

export function sortResourceSearchHits<T extends ResourceSearchHit>(cards: T[]): T[] {
  return [...cards].sort(compareResourceCardsNewestFirst);
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function truncateToUtf8Bytes(value: string, maxBytes: number): string {
  const encoded = new TextEncoder().encode(value);
  if (encoded.length <= maxBytes) return value;
  return new TextDecoder("utf-8", { fatal: false })
    .decode(encoded.slice(0, maxBytes))
    .replace(/\uFFFD/g, "")
    .trimEnd();
}

function kategoriCode(kategori: string | null): string {
  if (!kategori) return "a";
  return KATEGORI_CODE[kategori] ?? "a";
}

export function resourceSearchCallbackData(
  page: number,
  kategori: string | null,
  query: string,
): string {
  const safePage = Math.min(Math.max(1, page), RESOURCE_SEARCH_MAX_PAGE);
  const prefix = `rc:${String(safePage).padStart(2, "0")}:${kategoriCode(kategori)}:`;
  const budget = 64 - utf8ByteLength(prefix);
  return `${prefix}${truncateToUtf8Bytes(query, Math.max(0, budget))}`;
}

export function parseResourceSearchCallback(data: string | undefined): ResourceSearchCallback | null {
  const match = data?.match(/^rc:(\d{2}):([auspn]):(.*)$/);
  if (!match) return null;
  const page = Number(match[1]);
  if (!Number.isInteger(page) || page < 1 || page > RESOURCE_SEARCH_MAX_PAGE) return null;
  if (!(match[2] in CODE_KATEGORI)) return null;
  return {
    page,
    kategori: CODE_KATEGORI[match[2]] ?? null,
    query: match[3] ?? "",
  };
}

export function resourceSearchPageKeyboard(
  page: number,
  totalPages: number,
  kategori: string | null,
  query: string,
): Array<Array<{ text: string; callback_data: string }>> {
  if (totalPages <= 1) return [];
  const row: Array<{ text: string; callback_data: string }> = [];
  if (page > 1) {
    row.push({
      text: "«",
      callback_data: resourceSearchCallbackData(page - 1, kategori, query),
    });
  }
  row.push({
    text: `${page}/${totalPages}`,
    callback_data: resourceSearchCallbackData(page, kategori, query),
  });
  if (page < totalPages) {
    row.push({
      text: "»",
      callback_data: resourceSearchCallbackData(page + 1, kategori, query),
    });
  }
  return [row];
}

export function resourceSearchMonthLabel(card: {
  letterMonth?: string | null;
  createdAt: string;
}): string {
  if (card.letterMonth) return formatResourceMonthLabel(card.letterMonth);
  const uploaded = resourceMonthKey(card.createdAt);
  return uploaded ? formatResourceMonthLabel(uploaded) : "";
}

export function formatResourceSearchReply(
  query: string,
  cards: ResourceSearchHit[],
  opts: {
    limit?: number;
    page?: number;
    kategori?: string | null;
    help?: boolean;
  } = {},
): string {
  if (opts.help) return resourceSearchHelpText();

  const trimmed = query.trim();
  const kategori = opts.kategori ?? null;
  const kategoriLabel = resourceSearchKategoriLabel(kategori);
  const limit = opts.limit ?? RESOURCE_SEARCH_LIMIT;
  const totalPages = Math.max(1, Math.ceil(cards.length / limit) || 1);
  const page = Math.min(Math.max(1, opts.page ?? 1), cards.length === 0 ? 1 : totalPages);

  if (cards.length === 0) {
    if (trimmed && kategoriLabel) {
      return `Tiada surat sepadan untuk "${trimmed}" dalam ${kategoriLabel}. Cuba tajuk atau bulan.`;
    }
    if (trimmed) {
      return `Tiada surat sepadan untuk "${trimmed}". Cuba tajuk, kumpulan atau bulan.`;
    }
    if (kategoriLabel) {
      return `Tiada surat dalam ${kategoriLabel}.`;
    }
    return "Tiada surat dijumpai.";
  }

  const start = (page - 1) * limit;
  const shown = cards.slice(start, start + limit);
  const lines: string[] = [];
  if (trimmed) lines.push(`Carian: ${trimmed}`);
  if (kategoriLabel) lines.push(`Kumpulan: ${kategoriLabel}`);
  lines.push(
    cards.length === 1 ? "1 surat dijumpai · terkini dahulu." : `${cards.length} surat dijumpai · terkini dahulu.`,
  );
  if (totalPages > 1) lines.push(`Muka ${page}/${totalPages}`);
  lines.push("");

  shown.forEach((card, index) => {
    const title = card.title.trim().slice(0, 140);
    const month = resourceSearchMonthLabel(card);
    const meta = [kategori ? null : card.kategoriTitle, month].filter(Boolean).join(" · ");
    lines.push(`${start + index + 1}. ${title}`);
    if (meta) lines.push(`   ${meta}`);
    lines.push(`   ${card.url}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}

export function formatResourceManageList(
  cards: Array<ResourceSearchHit & { id: number }>,
  opts: { query?: string; kategori?: string | null; padamOnly?: boolean } = {},
): string {
  const trimmed = opts.query?.trim() ?? "";
  const kategoriLabel = resourceSearchKategoriLabel(opts.kategori ?? null);
  if (cards.length === 0) {
    if (trimmed) return `Tiada surat sepadan untuk "${trimmed}".`;
    return "Tiada surat untuk dikemas kini.";
  }
  const lines: string[] = [
    opts.padamOnly ? "Pilih surat untuk dipadam:" : "Pilih surat untuk dikemas kini:",
  ];
  if (trimmed) lines.push(`Carian: ${trimmed}`);
  if (kategoriLabel) lines.push(`Kumpulan: ${kategoriLabel}`);
  lines.push("");
  cards.forEach((card, index) => {
    const month = resourceSearchMonthLabel(card);
    const meta = [kategoriLabel ? null : card.kategoriTitle, month].filter(Boolean).join(" · ");
    lines.push(`${index + 1}. ${card.title.trim().slice(0, 140)}`);
    if (meta) lines.push(`   ${meta}`);
    lines.push("");
  });
  lines.push("Guna butang di bawah. Fail di Drive tidak dipindah atau dipadam.");
  return lines.join("\n").trim();
}
