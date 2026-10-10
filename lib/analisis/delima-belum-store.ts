import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisDelimaBelumLogin as T } from "@/lib/schema";
import type { DelimaBelumLoginRow } from "./delima-belum-parse";

export type DelimaBelumLogin = {
  /** Nama guru belum log masuk bagi sekolah ini (kosong = tiada dalam senarai). */
  nama: string[];
  /** Tarikh data fail sumber (YYYY-MM-DD). */
  tarikh: string;
};

/** Ganti keseluruhan senarai dengan fail baharu. */
export async function replaceDelimaBelumLogin(rows: DelimaBelumLoginRow[], listedOn: string) {
  await db.transaction(async (tx) => {
    await tx.delete(T);
    for (let i = 0; i < rows.length; i += 500) {
      await tx.insert(T).values(rows.slice(i, i + 500).map((r) => ({ ...r, listedOn })));
    }
  });
}

/**
 * Senarai belum log masuk bagi satu sekolah; null jika belum pernah dimuat naik (atau jadual
 * belum wujud — paparan sekolah tidak boleh ranap kerana ini).
 */
export async function getDelimaBelumLogin(kod: string): Promise<DelimaBelumLogin | null> {
  try {
    const [any] = await db.select({ d: T.listedOn }).from(T).limit(1);
    if (!any) return null;
    const rows = await db
      .select({ nama: T.nama })
      .from(T)
      .where(eq(T.kod, kod.trim().toUpperCase()))
      .orderBy(asc(T.nama));
    return { nama: rows.map((r) => r.nama), tarikh: String(any.d).slice(0, 10) };
  } catch {
    return null;
  }
}
