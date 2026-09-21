import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/schema";

export const PGDUMP_LAST_KEY = "backup:pgdump:last";

export type PgDumpLast = {
  at: string;
  fileName: string;
  sizeBytes: number;
};

export async function readLastPgDumpBackup(): Promise<PgDumpLast | null> {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, PGDUMP_LAST_KEY),
  });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as PgDumpLast;
  } catch {
    return null;
  }
}

export async function writeLastPgDumpBackup(info: PgDumpLast): Promise<void> {
  const value = JSON.stringify(info);
  await db
    .insert(appSettings)
    .values({ key: PGDUMP_LAST_KEY, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: sql`now()` },
    });
}
