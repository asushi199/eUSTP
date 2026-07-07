/**
 * Seragamkan nama guru sedia ada dalam Direktori ke format
 * "Huruf Besar Setiap Perkataan" (toTitleCaseName). Meliputi SEMUA versi
 * kenalan (contact_roles), bukan hanya versi semasa.
 *
 * Guna:
 *   npx tsx scripts/titlecase-teacher-names.ts            # dry-run (lalai)
 *   npx tsx scripts/titlecase-teacher-names.ts --apply    # tulis sebenar
 */
import "./load-env";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/schema";
import { contactRoles } from "../lib/schema";
import { toTitleCaseName } from "../lib/direktori/config";

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "Mod: TULIS SEBENAR (--apply)" : "Mod: dry-run (tiada perubahan)");

  const client = postgres(process.env.DATABASE_URL!, { max: 1, connect_timeout: 15 });
  const db = drizzle(client, { schema });

  try {
    const rows = await db
      .select({
        versionId: contactRoles.versionId,
        role: contactRoles.role,
        teacherName: contactRoles.teacherName,
      })
      .from(contactRoles);

    const changes = rows
      .map((r) => ({ ...r, next: toTitleCaseName(r.teacherName) }))
      .filter((r) => r.teacherName !== r.next && r.next.length > 0);

    console.log(`Jumlah baris contact_roles: ${rows.length}`);
    console.log(`Baris yang akan berubah: ${changes.length}`);

    const sample = changes.slice(0, 25);
    for (const c of sample) {
      console.log(`  [${c.role}] "${c.teacherName}"  ->  "${c.next}"`);
    }
    if (changes.length > sample.length) {
      console.log(`  … dan ${changes.length - sample.length} lagi.`);
    }

    if (!APPLY) {
      console.log("\nDry-run sahaja. Jalankan dengan --apply untuk menyimpan.");
      return;
    }

    if (changes.length === 0) {
      console.log("Tiada perubahan diperlukan.");
      return;
    }

    await db.transaction(async (tx) => {
      for (const c of changes) {
        await tx
          .update(contactRoles)
          .set({ teacherName: c.next })
          .where(
            and(
              eq(contactRoles.versionId, c.versionId),
              eq(contactRoles.role, c.role),
            ),
          );
      }
    });

    console.log(`\nSelesai. ${changes.length} nama dikemas kini.`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
