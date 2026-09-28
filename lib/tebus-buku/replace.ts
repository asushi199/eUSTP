import type { db } from "../db";
import { tebusBukuPelajar } from "../schema";
import type { TebusBukuImportRow } from "./csv";

const BATCH_SIZE = 500;

type Executor = Pick<typeof db, "delete" | "insert">;

/** Ganti keseluruhan snapshot dalam transaksi pemanggil. */
export async function replaceTebusBukuSnapshot(tx: Executor, rows: TebusBukuImportRow[]) {
  if (rows.length === 0) {
    throw new Error("Tiada rekod untuk diimport.");
  }
  await tx.delete(tebusBukuPelajar);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await tx.insert(tebusBukuPelajar).values(rows.slice(i, i + BATCH_SIZE));
  }
}
