import { resourceCardDisplay } from "./card-display";
import type { CardEmbedInfo } from "@/lib/kandungan/embed-urls";

const MYT = "Asia/Kuala_Lumpur";

export const BULAN_NAMA = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember",
] as const;

const BULAN_ALIAS: Record<string, number> = {
  januari: 1,
  january: 1,
  jan: 1,
  februari: 2,
  february: 2,
  feb: 2,
  mac: 3,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  jun: 6,
  june: 6,
  julai: 7,
  july: 7,
  jul: 7,
  ogos: 8,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  oktober: 10,
  october: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nov: 11,
  disember: 12,
  december: 12,
  dis: 12,
  dec: 12,
};

export type ResourcesExplorerCard = {
  id: number;
  title: string;
  url: string;
  kategoriSlug: string;
  kategoriTitle: string;
  createdAt: string;
  letterMonth: string | null;
  typeLabel: string;
  embed: CardEmbedInfo;
};

export type ResourcesExplorerGroup = {
  slug: string;
  title: string;
  blurb: string;
  cards: ResourcesExplorerCard[];
};

export function toResourcesExplorerGroups(
  groups: Array<{
    slug: string;
    title: string;
    blurb: string;
    cards: Array<{
      id: number;
      title: string;
      url: string;
      createdAt: Date | string;
      letterMonth?: string | null;
    }>;
  }>,
): ResourcesExplorerGroup[] {
  return groups.map((g) => ({
    slug: g.slug,
    title: g.title,
    blurb: g.blurb,
    cards: g.cards.map((c) => {
      const display = resourceCardDisplay(c.url);
      return {
        id: c.id,
        title: c.title,
        url: c.url,
        kategoriSlug: g.slug,
        kategoriTitle: g.title,
        createdAt:
          typeof c.createdAt === "string" ? c.createdAt : c.createdAt.toISOString(),
        letterMonth: c.letterMonth ?? null,
        typeLabel: display.typeLabel,
        embed: display.embed,
      };
    }),
  }));
}

export function normalizeResourceQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\-–—/.,:;()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filenameFromUrl(url: string): string {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const last = path.split("/").filter(Boolean).pop() ?? "";
    return last.replace(/\.[a-z0-9]+$/i, "");
  } catch {
    return "";
  }
}

export function resourceMonthKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: MYT,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return year && month ? `${year}-${month}` : "";
}

export function formatResourceMonthLabel(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return monthKey;
  const nama = BULAN_NAMA[Number(match[2]) - 1];
  return nama ? `${nama} ${match[1]}` : monthKey;
}

function padMonth(n: number): string {
  return String(n).padStart(2, "0");
}

export function currentLetterMonthKey(now = new Date()): string {
  return resourceMonthKey(now.toISOString());
}

/** Geser YYYY-MM sebanyak `delta` bulan. */
export function shiftLetterMonth(monthKey: string, delta: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return monthKey;
  const index = Number(match[1]) * 12 + Number(match[2]) - 1 + delta;
  const year = Math.floor(index / 12);
  const month = ((index % 12) + 12) % 12;
  return `${year}-${padMonth(month + 1)}`;
}

const LETTER_MONTH_MIN_YEAR = 2020;

export function clampLetterMonthCenter(centerMonth: string, now = new Date()): string {
  const currentYear = Number(currentLetterMonthKey(now).slice(0, 4));
  const maxYear = Number.isFinite(currentYear) ? currentYear + 5 : 2035;
  const year = Number(centerMonth.slice(0, 4));
  if (!/^\d{4}-\d{2}$/.test(centerMonth)) return currentLetterMonthKey(now);
  if (year < LETTER_MONTH_MIN_YEAR) {
    return `${LETTER_MONTH_MIN_YEAR}${centerMonth.slice(4)}`;
  }
  if (year > maxYear) {
    return `${maxYear}${centerMonth.slice(4)}`;
  }
  return centerMonth;
}

/** 7 bulan sebelum + bulan tengah + 7 bulan selepas (tertua dahulu, tengah di grid). */
export function listLetterMonthWindow(
  centerMonth: string,
): Array<{ value: string; label: string }> {
  const items: Array<{ value: string; label: string }> = [];
  for (let delta = -7; delta <= 7; delta += 1) {
    const value = shiftLetterMonth(centerMonth, delta);
    items.push({ value, label: formatResourceMonthLabel(value) });
  }
  return items;
}

/** 12 bulan lalu hingga 2 bulan akan datang (MYT) — borang admin. */
export function listLetterMonthChoices(now = new Date()): Array<{ value: string; label: string }> {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: MYT,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  let year = Number(parts.find((part) => part.type === "year")?.value);
  let month = Number(parts.find((part) => part.type === "month")?.value);
  if (!year || !month) return [];

  month += 2;
  if (month > 12) {
    year += 1;
    month -= 12;
  }

  const items: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < 15; i += 1) {
    const value = `${year}-${padMonth(month)}`;
    items.push({ value, label: formatResourceMonthLabel(value) });
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }
  return items;
}

/** Kunci bulan: bulan surat jika ada, else tarikh muat naik, plus bulan pada tajuk. */
export function cardMonthKeys(card: {
  title: string;
  url: string;
  createdAt: string;
  letterMonth?: string | null;
}): string[] {
  const keys = new Set<string>();
  if (card.letterMonth) {
    keys.add(card.letterMonth);
  } else {
    const uploaded = resourceMonthKey(card.createdAt);
    if (uploaded) keys.add(uploaded);
  }

  const text = `${card.title} ${filenameFromUrl(card.url)}`;
  const lower = text.toLowerCase();

  for (const match of lower.matchAll(
    /\b(januari|january|jan|februari|february|feb|mac|march|mar|april|apr|mei|may|jun|june|julai|july|jul|ogos|august|aug|september|sept|sep|oktober|october|okt|oct|november|nov|disember|december|dis|dec)\b(?:\s+(\d{4}))?/g,
  )) {
    const month = BULAN_ALIAS[match[1] ?? ""];
    const year = match[2];
    if (month && year) keys.add(`${year}-${padMonth(month)}`);
  }

  for (const match of text.matchAll(/\b(\d{4})-(\d{2})\b/g)) {
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) keys.add(`${match[1]}-${padMonth(month)}`);
  }

  return [...keys];
}

export function resourceSearchHaystack(card: {
  title: string;
  url: string;
  kategoriTitle: string;
  createdAt: string;
}): string {
  const monthKeys = cardMonthKeys(card);
  const monthLabels = monthKeys.map(formatResourceMonthLabel);
  return normalizeResourceQuery(
    [
      card.title,
      filenameFromUrl(card.url),
      card.kategoriTitle,
      card.createdAt.slice(0, 10),
      ...monthKeys,
      ...monthLabels,
    ].join(" "),
  );
}

export function cardMatchesResourceQuery(
  card: {
    title: string;
    url: string;
    kategoriTitle: string;
    createdAt: string;
  },
  query: string,
): boolean {
  const tokens = normalizeResourceQuery(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = resourceSearchHaystack(card);
  return tokens.every((token) => haystack.includes(token));
}

export function filterResourceCards<T extends ResourcesExplorerCard>(
  cards: T[],
  opts: { query?: string; month?: string },
): T[] {
  const query = opts.query ?? "";
  const month = opts.month?.trim() ?? "";
  return cards.filter((card) => {
    if (month && !cardMonthKeys(card).includes(month)) return false;
    return cardMatchesResourceQuery(card, query);
  });
}

export function listResourceMonthOptions(
  cards: Array<{ title: string; url: string; createdAt: string }>,
): Array<{ value: string; label: string }> {
  const keys = new Set<string>();
  for (const card of cards) {
    for (const key of cardMonthKeys(card)) keys.add(key);
  }
  return [...keys]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => ({ value, label: formatResourceMonthLabel(value) }));
}
