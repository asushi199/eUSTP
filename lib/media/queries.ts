import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mediaCards } from "@/lib/schema";
import { MEDIA_KATEGORI } from "./kategori";

export type MediaCard = typeof mediaCards.$inferSelect;

export async function listMediaCards(
  kategori: string,
  opts: { includeHidden?: boolean } = {},
): Promise<MediaCard[]> {
  const filters = [eq(mediaCards.kategori, kategori)];
  if (!opts.includeHidden) filters.push(eq(mediaCards.aktif, true));
  return db
    .select()
    .from(mediaCards)
    .where(and(...filters))
    .orderBy(asc(mediaCards.sort), asc(mediaCards.id));
}

export async function getMediaCard(id: number): Promise<MediaCard | undefined> {
  return db.query.mediaCards.findFirst({
    where: eq(mediaCards.id, id),
  });
}

export type MediaKategoriGroup = {
  slug: string;
  title: string;
  blurb: string;
  cards: MediaCard[];
};

/** Semua kategori dengan kad masing-masing (hub /media). */
export async function listMediaCardsGrouped(
  opts: { includeHidden?: boolean } = {},
): Promise<MediaKategoriGroup[]> {
  const rows = opts.includeHidden
    ? await db
        .select()
        .from(mediaCards)
        .orderBy(asc(mediaCards.sort), asc(mediaCards.id))
    : await db
        .select()
        .from(mediaCards)
        .where(eq(mediaCards.aktif, true))
        .orderBy(asc(mediaCards.sort), asc(mediaCards.id));

  const byKat = new Map<string, MediaCard[]>(
    MEDIA_KATEGORI.map((k) => [k.slug, [] as MediaCard[]]),
  );
  for (const r of rows) {
    byKat.get(r.kategori)?.push(r);
  }
  return MEDIA_KATEGORI.map((k) => ({
    slug: k.slug,
    title: k.title,
    blurb: k.blurb,
    cards: byKat.get(k.slug) ?? [],
  }));
}
