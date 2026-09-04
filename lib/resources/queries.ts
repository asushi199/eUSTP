import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resourcesCards } from "@/lib/schema";
import { RESOURCES_KATEGORI } from "./kategori";

export type ResourcesCard = typeof resourcesCards.$inferSelect;

export async function listResourcesCards(
  kategori: string,
  opts: { includeHidden?: boolean } = {},
): Promise<ResourcesCard[]> {
  const filters = [eq(resourcesCards.kategori, kategori)];
  if (!opts.includeHidden) filters.push(eq(resourcesCards.aktif, true));
  return db
    .select()
    .from(resourcesCards)
    .where(and(...filters))
    .orderBy(asc(resourcesCards.sort), asc(resourcesCards.id));
}

export async function getResourcesCard(id: number): Promise<ResourcesCard | undefined> {
  return db.query.resourcesCards.findFirst({
    where: eq(resourcesCards.id, id),
  });
}

export type ResourcesKategoriGroup = {
  slug: string;
  title: string;
  blurb: string;
  cards: ResourcesCard[];
};

/** Semua kategori dengan kad masing-masing (hub accordion /resources). */
export async function listResourcesCardsGrouped(
  opts: { includeHidden?: boolean } = {},
): Promise<ResourcesKategoriGroup[]> {
  const rows = opts.includeHidden
    ? await db
        .select()
        .from(resourcesCards)
        .orderBy(asc(resourcesCards.sort), asc(resourcesCards.id))
    : await db
        .select()
        .from(resourcesCards)
        .where(eq(resourcesCards.aktif, true))
        .orderBy(asc(resourcesCards.sort), asc(resourcesCards.id));

  const byKat = new Map<string, ResourcesCard[]>(
    RESOURCES_KATEGORI.map((k) => [k.slug, [] as ResourcesCard[]]),
  );
  for (const r of rows) {
    byKat.get(r.kategori)?.push(r);
  }
  return RESOURCES_KATEGORI.map((k) => ({
    slug: k.slug,
    title: k.title,
    blurb: k.blurb,
    cards: byKat.get(k.slug) ?? [],
  }));
}
