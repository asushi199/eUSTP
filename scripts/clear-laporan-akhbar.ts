/**
 * Padam semua rekod tinjauan Laporan Akhbar (jadual laporan_akhbar).
 * Tidak menyentuh jadual schools atau modul lain.
 *
 * Guna:
 *   npx tsx scripts/clear-laporan-akhbar.ts            # dry-run (lalai)
 *   npx tsx scripts/clear-laporan-akhbar.ts --apply    # padam sebenar
 */
import "./load-env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/schema";
import { laporanAkhbar } from "../lib/schema";
import { normalizeDatabaseUrl } from "../lib/database-url";

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "Mod: PADAM SEBENAR (--apply)" : "Mod: dry-run (tiada perubahan)");

  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
  const client = postgres(connectionString, {
    max: 1,
    connect_timeout: 15,
    prepare: false,
  });
  const db = drizzle(client, { schema });

  try {
    const rows = await db
      .select({
        schoolCode: laporanAkhbar.schoolCode,
        year: laporanAkhbar.year,
        statusSekolah: laporanAkhbar.statusSekolah,
      })
      .from(laporanAkhbar);

    console.log(`Jumlah rekod laporan_akhbar: ${rows.length}`);
    for (const r of rows.slice(0, 30)) {
      console.log(`  ${r.schoolCode} (${r.year}) — ${r.statusSekolah}`);
    }
    if (rows.length > 30) {
      console.log(`  … dan ${rows.length - 30} lagi.`);
    }

    if (!APPLY) {
      console.log("\nTiada perubahan. Jalankan semula dengan --apply untuk memadam.");
      return;
    }

    if (rows.length === 0) {
      console.log("Tiada rekod untuk dipadam.");
      return;
    }

    await db.delete(laporanAkhbar);
    console.log(`\nSelesai: ${rows.length} rekod dipadam.`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
