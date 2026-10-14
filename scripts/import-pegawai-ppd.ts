import "./load-env";
import { readFileSync } from "node:fs";
import { namaKunci } from "../lib/mjkd/nama-kunci";
import { parsePegawaiPpdCsv } from "../lib/mjkd/pegawai-csv";

/**
 * Import senarai pegawai PPD (untuk kehadiran MJKD) daripada CSV tempatan dengan header
 * `nama,jawatan,sektor`. Upsert mengikut nama dinormalkan; susunan = susunan baris CSV.
 * TIADA lajur IC / nama pengguna — header lain ditolak. Jangan komit fail CSV ke git.
 *
 * Guna: npm run db:import-pegawai-ppd -- <fail.csv> [--dry-run]
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fail = args.find((a) => !a.startsWith("--"));
  if (!fail) throw new Error("Guna: db:import-pegawai-ppd -- <fail.csv> [--dry-run]");

  const baris = parsePegawaiPpdCsv(readFileSync(fail, "utf8"));
  console.log(`CSV: ${baris.length} pegawai (selepas buang nama berganda).`);

  const { db } = await import("../lib/db");
  const { pegawaiPpd } = await import("../lib/schema");
  const { eq } = await import("drizzle-orm");

  const sedia = await db.select().from(pegawaiPpd);
  const idMengikutKunci = new Map(sedia.map((p) => [namaKunci(p.nama), p]));

  let baharu = 0;
  let dikemaskini = 0;
  let takBerubah = 0;
  for (const [i, b] of baris.entries()) {
    const lama = idMengikutKunci.get(namaKunci(b.nama));
    const sort = i + 1;
    if (!lama) {
      baharu += 1;
      if (!dryRun) {
        await db.insert(pegawaiPpd).values({ ...b, sort, aktif: true });
      }
      continue;
    }
    const sama =
      lama.jawatan === b.jawatan &&
      lama.sektor === b.sektor &&
      lama.sort === sort &&
      lama.aktif;
    if (sama) {
      takBerubah += 1;
      continue;
    }
    dikemaskini += 1;
    if (!dryRun) {
      await db
        .update(pegawaiPpd)
        .set({ jawatan: b.jawatan, sektor: b.sektor, sort, aktif: true, updatedAt: new Date() })
        .where(eq(pegawaiPpd.id, lama.id));
    }
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}Baharu ${baharu}, dikemas kini ${dikemaskini}, tiada perubahan ${takBerubah}.`,
  );
  console.log("Pegawai yang tiada dalam CSV tidak diubah (nyahaktifkan melalui admin).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
