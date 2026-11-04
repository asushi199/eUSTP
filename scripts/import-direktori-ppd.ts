import "./load-env";
import { readFileSync } from "node:fs";
import { parseDirektoriPpdCsv } from "../lib/direktori-ppd/csv";

/**
 * Import Direktori PPD (admin/direktori-ppd) daripada CSV eksport helaian pegawai PPD
 * (lajur BIL, NAMA PEGAWAI, GRED SSPA (PENYANDANG), JAWATAN, NO TEL). Upsert mengikut nama
 * dinormalkan; susunan = susunan baris. Pegawai yang tiada lagi dalam CSV DIPADAM.
 * Mengandungi no. telefon — jangan komit fail CSV ke git.
 *
 * Guna: npm run db:import-direktori-ppd -- <fail.csv> [--dry-run]
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fail = args.find((a) => !a.startsWith("--"));
  if (!fail) throw new Error("Guna: db:import-direktori-ppd -- <fail.csv> [--dry-run]");

  const baris = parseDirektoriPpdCsv(readFileSync(fail, "utf8"));
  console.log(`CSV: ${baris.length} pegawai (baris kosong/KOSONG dilangkau).`);

  const { db } = await import("../lib/db");
  const { direktoriPpd } = await import("../lib/schema");
  const { eq, inArray } = await import("drizzle-orm");

  const sedia = await db.select().from(direktoriPpd);
  const mengikutKunci = new Map(sedia.map((p) => [p.namaKunci, p]));
  const kunciCsv = new Set(baris.map((b) => b.namaKunci));

  let baharu = 0;
  let dikemaskini = 0;
  let takBerubah = 0;
  for (const [i, b] of baris.entries()) {
    const sort = i + 1;
    const lama = mengikutKunci.get(b.namaKunci);
    if (!lama) {
      baharu += 1;
      if (!dryRun) await db.insert(direktoriPpd).values({ ...b, sort });
      continue;
    }
    if (lama.nama === b.nama && lama.gred === b.gred && lama.jawatan === b.jawatan && lama.telefon === b.telefon && lama.sort === sort) {
      takBerubah += 1;
      continue;
    }
    dikemaskini += 1;
    if (!dryRun) {
      await db
        .update(direktoriPpd)
        .set({ nama: b.nama, gred: b.gred, jawatan: b.jawatan, telefon: b.telefon, sort, updatedAt: new Date() })
        .where(eq(direktoriPpd.id, lama.id));
    }
  }

  const dibuang = sedia.filter((p) => !kunciCsv.has(p.namaKunci));
  if (dibuang.length > 0 && !dryRun) {
    await db.delete(direktoriPpd).where(inArray(direktoriPpd.id, dibuang.map((p) => p.id)));
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}Baharu: ${baharu}, dikemaskini: ${dikemaskini}, tak berubah: ${takBerubah}, dibuang: ${dibuang.length}.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
