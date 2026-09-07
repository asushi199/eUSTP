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

const MONTH_TOKENS: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2,
  mac: 3, mar: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, june: 6,
  jul: 7, julai: 7, july: 7,
  ogo: 8, ogos: 8, aug: 8, ogs: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, oktober: 10, october: 10,
  nov: 11, november: 11,
  dis: 12, dec: 12, disember: 12, december: 12,
};

// Kesan tarikh snapshot dari nama fail, cth. "26Ogos2026" atau "7 Sept 2026".
function parseSourcedAt(filePath: string): string {
  const compact = /(\d{1,2})\s*([A-Za-z]+)\s*(\d{4})/.exec(filePath);
  if (compact) {
    const month = MONTH_TOKENS[compact[2].toLowerCase()];
    if (month) {
      return `${compact[3]}-${String(month).padStart(2, "0")}-${compact[1].padStart(2, "0")}`;
    }
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
