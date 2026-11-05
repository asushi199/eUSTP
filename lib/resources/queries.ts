import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, LONG_REVALIDATE_S } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { resourcesCards } from "@/lib/schema";
import { RESOURCES_KATEGORI } from "./kategori";

export type ResourcesCard = typeof resourcesCards.$inferSelect;

/**
 * Tag cache kad awam (aktif). Setiap tulis ke `resourcesCards` MESTI
 * `revalidateTag(RESOURCES_CACHE_TAG)` — lihat helper revalidate dalam actions/publish.
 * Cache = kawal egress Supabase: lonjakan pelawat tidak menambah query DB.
 */
export const RESOURCES_CACHE_TAG = CACHE_TAGS.resources;

const listActiveRowsCached = unstable_cache(
  async () =>
    db
      .select()
      .from(resourcesCards)
      .where(eq(resourcesCards.aktif, true))
      .orderBy(asc(resourcesCards.sort), asc(resourcesCards.id)),
  ["resources:active-cards"],
  { revalidate: LONG_REVALIDATE_S, tags: [RESOURCES_CACHE_TAG] },
);

/** unstable_cache menyiri JSON — pulihkan Date. */
async function listActiveRows(): Promise<ResourcesCard[]> {
  const rows = await listActiveRowsCached();
  return rows.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export async function listResourcesCards(
  kategori: string,
  opts: { includeHidden?: boolean } = {},
): Promise<ResourcesCard[]> {
  if (!opts.includeHidden) {
    return (await listActiveRows()).filter((r) => r.kategori === kategori);
  }
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

/** Semua kategori dengan kad masing-masing (hub /resources). */
export async function listResourcesCardsGrouped(
  opts: { includeHidden?: boolean } = {},
): Promise<ResourcesKategoriGroup[]> {
  const rows = opts.includeHidden
    ? await db
        .select()
        .from(resourcesCards)
        .orderBy(asc(resourcesCards.sort), asc(resourcesCards.id))
    : await listActiveRows();

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
