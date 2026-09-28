import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "./load-env";
import * as schema from "../lib/schema";
import {
  formatKualaLumpurDate,
  parseManjungCsv,
  sourcedAtFromFilename,
  summarizeTebusBuku,
  withSourcedAt,
} from "../lib/tebus-buku/csv";
import { replaceTebusBukuSnapshot } from "../lib/tebus-buku/replace";

const DEFAULT_CSV = resolve(process.cwd(), "tebus buku", "PPD_MANJUNG_26Ogos2026.csv");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditetapkan");

  const csvPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : DEFAULT_CSV;
  const sourcedAt =
    sourcedAtFromFilename(basename(csvPath)) ?? formatKualaLumpurDate(new Date());
  const drafts = parseManjungCsv(await readFile(csvPath, "utf8"));
  if (drafts.length === 0) {
    throw new Error(`Tiada rekod PPD MANJUNG dalam ${csvPath}`);
  }

  const summary = summarizeTebusBuku(drafts);
  const rows = withSourcedAt(drafts, sourcedAt);
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  await db.transaction(async (tx) => {
    await replaceTebusBukuSnapshot(tx, rows);
  });

  await client.end();
  console.log(
    `Import tebus buku: ${summary.pelajar} pelajar, ${summary.sekolah} sekolah, tebus ${summary.sudahTebus}, guna ${summary.sudahGuna}, tarikh ${sourcedAt}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
