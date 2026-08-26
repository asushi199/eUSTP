import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "./load-env";
import * as schema from "../lib/schema";

const DEFAULT_CSV = resolve(
  process.cwd(),
  "tebus buku",
  "PPD_MANJUNG_26Ogos2026.csv",
);
const BATCH_SIZE = 500;

type PelajarRow = {
  schoolCode: string;
  schoolName: string;
  nama: string;
  email: string;
  tingkatan: string;
  sudahTebus: boolean;
  sudahGuna: boolean;
  sourcedAt: string;
};

function parseCsvLine(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current.trim());
  return parts;
}

function parseSourcedAt(filePath: string): string {
  const match = /(\d{1,2})Ogos(\d{4})/i.exec(filePath);
  if (match) {
    return `${match[2]}-08-${match[1].padStart(2, "0")}`;
  }
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

async function readManjungRows(filePath: string): Promise<PelajarRow[]> {
  const sourcedAt = parseSourcedAt(filePath);
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const rows: PelajarRow[] = [];
  const seen = new Set<string>();
  let header = true;

  for await (const raw of rl) {
    if (!raw) continue;
    const line = raw.replace(/^\uFEFF/, "");
    if (header) {
      header = false;
      continue;
    }
    const parts = parseCsvLine(line);
    const ppd = parts[0] ?? "";
    if (ppd !== "PPD MANJUNG") continue;

    const schoolCode = (parts[1] ?? "").trim().toUpperCase();
    const schoolName = (parts[2] ?? "").trim();
    const nama = (parts[3] ?? "").trim();
    const email = (parts[4] ?? "").trim().toLowerCase();
    const tingkatan = (parts[5] ?? "").trim();
    const tebus = (parts[6] ?? "").trim();
    const guna = (parts[7] ?? "").trim();

    if (!schoolCode || !nama || !email) continue;
    if (seen.has(email)) continue;
    seen.add(email);

    rows.push({
      schoolCode,
      schoolName,
      nama,
      email,
      tingkatan,
      sudahTebus: tebus === "Sudah Tebus",
      sudahGuna: guna === "Sudah Guna",
      sourcedAt,
    });
  }

  return rows;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditetapkan");

  const csvPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : DEFAULT_CSV;
  const rows = await readManjungRows(csvPath);
  if (rows.length === 0) {
    throw new Error(`Tiada rekod PPD MANJUNG dalam ${csvPath}`);
  }

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  await db.transaction(async (tx) => {
    await tx.delete(schema.tebusBukuPelajar);
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await tx.insert(schema.tebusBukuPelajar).values(rows.slice(i, i + BATCH_SIZE));
    }
  });

  await client.end();
  console.log(`Import tebus buku: ${rows.length} pelajar PPD MANJUNG.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
