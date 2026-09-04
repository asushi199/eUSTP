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

/** Bilangan kad aktif setiap kategori (halaman hub /resources). */
export async function countActiveResourcesByKategori(): Promise<Map<string, number>> {
  const rows = await db
    .select({ kategori: resourcesCards.kategori })
    .from(resourcesCards)
    .where(eq(resourcesCards.aktif, true));
  const counts = new Map<string, number>(RESOURCES_KATEGORI.map((k) => [k.slug, 0]));
  for (const r of rows) {
    counts.set(r.kategori, (counts.get(r.kategori) ?? 0) + 1);
  }
  return counts;
}
