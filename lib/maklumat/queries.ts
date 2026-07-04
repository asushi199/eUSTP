import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings, pegawai } from "@/lib/schema";

/** Nilai tetapan untuk senarai kunci — Map kosong bagi kunci tiada. */
export async function getSettings(keys: string[]): Promise<Map<string, string>> {
  if (keys.length === 0) return new Map();
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, keys));
  return new Map(rows.map((r) => [r.key, r.value]));
}

export type Pegawai = typeof pegawai.$inferSelect;

export async function listPegawaiAktif(): Promise<Pegawai[]> {
  return db
    .select()
    .from(pegawai)
    .where(eq(pegawai.aktif, true))
    .orderBy(asc(pegawai.sort), asc(pegawai.id));
}
