import "./load-env";
import { readFileSync } from "node:fs";
import { semakDcs, type DcsSnapshot } from "../lib/analisis/dcs-types";

/**
 * Import snapshot DCS (dcs.moe.edu.my) — JSON yang dihimpun daripada 5 akaun PKG Manjung
 * (Dashboard, Progress, Top Schools, PKG Ranking). Idempoten ikut `capturedOn`.
 *
 * Guna: npm run db:import-dcs -- scripts/data/dcs-2026-10-16.json [--dry-run]
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fail = args.find((a) => !a.startsWith("--"));
  if (!fail) throw new Error("Guna: db:import-dcs -- <fail.json> [--dry-run]");

  const data = JSON.parse(readFileSync(fail, "utf8")) as DcsSnapshot;
  if (!data.tahun || !/^\d{4}-\d{2}-\d{2}$/.test(data.capturedOn ?? "")) {
    throw new Error("JSON mesti ada `tahun` dan `capturedOn` (YYYY-MM-DD).");
  }
  const ralat = semakDcs(data);
  if (ralat.length > 0) throw new Error(`Jumlah tidak sepadan:\n  ${ralat.join("\n  ")}`);

  const siap = data.pkg.reduce((a, p) => a + p.muridSiap, 0);
  const jumlah = data.pkg.reduce((a, p) => a + p.muridJumlah, 0);
  console.log(
    `${data.tahun} · ${data.capturedOn} · ${data.pkg.length} PKG · ${data.sekolah.length} sekolah · murid ${siap}/${jumlah}`,
  );
  if (dryRun) {
    console.log("--dry-run: tiada perubahan.");
    process.exit(0);
  }

  const { db } = await import("../lib/db");
  const { analisisDcsSnapshots } = await import("../lib/schema");
  await db
    .insert(analisisDcsSnapshots)
    .values({ tahun: data.tahun, capturedOn: data.capturedOn, data })
    .onConflictDoUpdate({
      target: analisisDcsSnapshots.capturedOn,
      set: { tahun: data.tahun, data },
    });
  console.log("Disimpan.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
