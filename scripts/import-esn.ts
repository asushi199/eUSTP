import "./load-env";
import { readFileSync } from "node:fs";
import { jumlahMuridEsn, semakEsn, type EsnSnapshot } from "../lib/analisis/esn-types";

/**
 * Import snapshot ESN (esn.moe.edu.my) — JSON daripada Dashboard + Status Pelaksanaan
 * akaun PPD Manjung. Idempoten ikut `capturedOn`.
 *
 * Guna: npm run db:import-esn -- scripts/data/esn-2026-10-16.json [--dry-run]
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fail = args.find((a) => !a.startsWith("--"));
  if (!fail) throw new Error("Guna: db:import-esn -- <fail.json> [--dry-run]");

  const data = JSON.parse(readFileSync(fail, "utf8")) as EsnSnapshot;
  if (!data.tahun || !/^\d{4}-\d{2}-\d{2}$/.test(data.capturedOn ?? "")) {
    throw new Error("JSON mesti ada `tahun` dan `capturedOn` (YYYY-MM-DD).");
  }
  const ralat = semakEsn(data);
  if (ralat.length > 0) throw new Error(`Jumlah tidak sepadan:\n  ${ralat.join("\n  ")}`);

  const m = jumlahMuridEsn(data);
  console.log(`${data.tahun} · ${data.capturedOn} · ${data.sekolah.length} sekolah · murid selesai ${m.siap}/${m.jumlah}`);
  if (dryRun) {
    console.log("--dry-run: tiada perubahan.");
    process.exit(0);
  }

  const { db } = await import("../lib/db");
  const { analisisEsnSnapshots } = await import("../lib/schema");
  await db
    .insert(analisisEsnSnapshots)
    .values({ tahun: data.tahun, capturedOn: data.capturedOn, data })
    .onConflictDoUpdate({
      target: analisisEsnSnapshots.capturedOn,
      set: { tahun: data.tahun, data },
    });
  console.log("Disimpan.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
