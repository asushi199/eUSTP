import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { kandunganCards } from "@/lib/schema";
import type { Topik } from "./topik";

export type KandunganCard = typeof kandunganCards.$inferSelect;

export type SubtopikGroup = {
  key: string;
  title: string;
  blurb: string;
  icon: string;
  sort: number;
  cards: KandunganCard[];
};

/** Kad aktif satu topik, dikumpul ikut subtopik (susunan subtopikSort → sort). */
export async function getTopikGroups(topik: Topik): Promise<SubtopikGroup[]> {
  const rows = await db
    .select()
    .from(kandunganCards)
    .where(and(eq(kandunganCards.topik, topik), eq(kandunganCards.aktif, true)))
    .orderBy(
      asc(kandunganCards.subtopikSort),
      asc(kandunganCards.sort),
      asc(kandunganCards.id),
    );

  const groups = new Map<string, SubtopikGroup>();
  for (const row of rows) {
    const key = row.subtopikKey || "__tiada__";
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        title: row.subtopikTitle,
        blurb: row.subtopikBlurb,
        icon: row.subtopikIcon,
        sort: row.subtopikSort,
        cards: [],
      };
      groups.set(key, g);
    }
    /* Medan subtopik denormalised — baris pertama kumpulan jadi rujukan. */
    g.cards.push(row);
  }
  return [...groups.values()];
}

/** Bilangan kad aktif setiap topik (untuk halaman landing /sumber). */
export async function countCardsByTopik(): Promise<Map<string, number>> {
  const rows = await db
    .select({ topik: kandunganCards.topik })
    .from(kandunganCards)
    .where(eq(kandunganCards.aktif, true));
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.topik, (counts.get(r.topik) ?? 0) + 1);
  return counts;
}
