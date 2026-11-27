import "./load-env";
import { revalidateSite } from "./revalidate-site";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { parseD3Csv } from "../lib/analisis/delima-d3-parse";

/**
 * Import snapshot DELIMa 3.0 daripada d3.delima.edu.my (Utama, tempoh 1 Jan → tarikh fail).
 * Tarikh akhir diambil daripada nama fail `delima-d3-YYYY-MM-DD.csv`; tempoh = 1 Jan tahun itu.
 * Disimpan sebagai snapshot bulanan (period YYYY-MM) dengan sumber_url d3 — cron DELIMa Perak
 * tidak menimpa baris ini. Idempoten: import semula bulan yang sama menggantikan angka.
 * Teras semakan + simpan dikongsi dengan penanda d3 (`lib/analisis/delima-d3-simpan.ts`).
 *
 * Guna: npm run db:import-delima-d3 -- scripts/data/delima-d3-2026-10-16.csv [--dry-run]
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fail = args.find((a) => !a.startsWith("--"));
  if (!fail) throw new Error("Guna: db:import-delima-d3 -- <fail.csv> [--dry-run]");
  const m = basename(fail).match(/(\d{4}-\d{2}-\d{2})\.csv$/i);
  if (!m) throw new Error("Nama fail mesti berakhir dengan YYYY-MM-DD.csv (tarikh akhir data).");

  const data = parseD3Csv(readFileSync(fail, "utf8"));
  // Import dinamik: `lib/db` mesti dimuat selepas load-env.
  const { prosesDelimaD3 } = await import("../lib/analisis/delima-d3-simpan");
  const r = await prosesDelimaD3(data, m[1]!, !dryRun);

  console.log(
    `${r.period} · ${r.tempoh} · ${r.bilSekolah} sekolah · guru ${r.guru.aktif}/${r.guru.jumlah} (${r.guru.peratus}%) · ` +
      `murid ${r.murid.aktif}/${r.murid.jumlah} (${r.murid.peratus}%) · capai KPI murid ${r.bilCapai ?? "—"}`,
  );
  if (!r.disimpan) {
    console.log("--dry-run: tiada perubahan.");
    process.exit(0);
  }
  console.log(`Snapshot ${r.disimpan.dicipta ? "dicipta" : "dikemas kini"} (id ${r.disimpan.id}).`);
  await revalidateSite(["home"]);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
