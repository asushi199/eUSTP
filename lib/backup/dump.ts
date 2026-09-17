/**
 * Sandaran pangkalan data — dump logik semua jadual `public` menjadi satu fail
 * JSON setiap jadual, dimampatkan ke ZIP. Bukan `pg_dump` (binari itu tidak
 * tersedia di Vercel serverless); ini eksport selamat (safety net) yang boleh
 * dibaca manusia dan diimport semula secara berhati-hati.
 *
 * Peranan `postgres` (Drizzle) memintas RLS, jadi semua baris terkandung.
 * ZIP mengandungi data sensitif (hash kata laluan, token) — hanya untuk Admin.
 */
import { sql } from "drizzle-orm";
import JSZip from "jszip";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";

const TZ = "Asia/Kuala_Lumpur";

export type BackupResult = {
  buffer: Buffer;
  fileName: string;
  tableCount: number;
  rowCount: number;
  /** Folder sasaran di Google Drive: ["_backup", tahun, tahun-bulan]. */
  subPath: string[];
};

/** postgres-js memulangkan array baris; sesetengah pemacu memulangkan { rows }. */
function normalizeRows(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  const rows = (res as { rows?: unknown } | null)?.rows;
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

/** bigint → string; bytea (Uint8Array/Buffer) → penanda base64. Date → ISO (auto). */
function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) {
    return { __type: "bytea", base64: Buffer.from(value).toString("base64") };
  }
  return value;
}

export async function createBackupZip(): Promise<BackupResult> {
  const tablesRes = await db.execute(sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);
  const tableNames = normalizeRows(tablesRes)
    .map((r) => String(r.table_name))
    .filter(Boolean);

  const zip = new JSZip();
  const tablesFolder = zip.folder("tables");
  const summary: { table: string; rows: number }[] = [];
  let rowCount = 0;

  for (const name of tableNames) {
    // Nama datang dari information_schema (jadual sebenar); tetap petik & escape.
    const ident = `"public"."${name.replace(/"/g, '""')}"`;
    const rowsRes = await db.execute(sql.raw(`select * from ${ident}`));
    const rows = normalizeRows(rowsRes);
    rowCount += rows.length;
    summary.push({ table: name, rows: rows.length });
    tablesFolder?.file(`${name}.json`, JSON.stringify(rows, jsonReplacer, 2));
  }

  const now = new Date();
  const manifest = {
    app: "eUSTP Manjung",
    format: "json-per-table@1",
    generatedAt: now.toISOString(),
    generatedAtLocal: formatInTimeZone(now, TZ, "yyyy-MM-dd HH:mm:ss (zzz)"),
    tableCount: tableNames.length,
    rowCount,
    tables: summary,
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file(
    "README.txt",
    [
      "Sandaran pangkalan data eUSTP Manjung (Supabase Postgres).",
      "Format: satu fail JSON setiap jadual dalam folder tables/.",
      'bytea dikodkan sebagai { "__type": "bytea", "base64": "..." }.',
      "Timestamp dalam ISO 8601 (UTC).",
      "AMARAN: fail ini mengandungi data sensitif (hash kata laluan, token).",
      "Simpan dengan selamat. Untuk pemulihan, import semula setiap jadual",
      "mengikut susunan kebergantungan kunci asing (FK).",
    ].join("\n"),
  );

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const stamp = formatInTimeZone(now, TZ, "yyyyMMdd-HHmmss");
  const year = formatInTimeZone(now, TZ, "yyyy");
  const month = formatInTimeZone(now, TZ, "yyyy-MM");
  return {
    buffer,
    fileName: `eustp-backup-${stamp}.zip`,
    tableCount: tableNames.length,
    rowCount,
    subPath: ["_backup", year, month],
  };
}
