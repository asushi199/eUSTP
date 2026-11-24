import "./load-env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { revalidateSite } from "./revalidate-site";

/**
 * Import Pensijilan Digital daripada scripts/data/analisis-pensijilan.csv — ganti metrik &
 * pecahan modul `pensijilan` SAHAJA (seed-dashboard memadam semua modul analisis).
 *
 * Format baris: `key,value` (metrik) atau `category,<kind>,<label>,<bil>` dengan kind
 * location|school|google|apple|microsoft.
 *
 * Guna: npm run db:import-pensijilan [-- --dry-run]
 */

/** CSV ringkas dengan sokongan petikan "..." (koma dalam teks). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') (cur += '"'), i++;
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") cells.push(cur), (cur = "");
      else cur += c;
    }
    cells.push(cur);
    rows.push(cells.map((s) => s.trim()));
  }
  return rows;
}

const KIND: Record<string, string> = { location: "lokasi", lokasi: "lokasi", school: "sekolah", sekolah: "sekolah" };

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const rows = parseCsv(readFileSync(join(__dirname, "data", "analisis-pensijilan.csv"), "utf8"));

  const metrics: { modul: "pensijilan"; key: string; value: string }[] = [];
  const breakdown: { modul: "pensijilan"; kind: string; label: string; value: number; sort: number }[] = [];
  for (const [k, ...rest] of rows) {
    if (!k || k.toLowerCase() === "key") continue;
    if (k.toLowerCase() === "category") {
      const [kindRaw, label, v] = rest;
      const value = Number(v);
      if (!kindRaw || !label || !Number.isFinite(value)) throw new Error(`Baris category tidak sah: ${rest.join(",")}`);
      const kind = KIND[kindRaw.toLowerCase()] ?? kindRaw.toLowerCase();
      breakdown.push({ modul: "pensijilan", kind, label, value, sort: breakdown.length });
      continue;
    }
    const value = rest.find((s) => s !== "") ?? "";
    if (value) metrics.push({ modul: "pensijilan", key: k, value });
  }

  const ikut = new Map<string, number>();
  for (const b of breakdown) ikut.set(b.kind, (ikut.get(b.kind) ?? 0) + b.value);
  console.log(`${metrics.length} metrik, ${breakdown.length} pecahan`);
  for (const [kind, n] of ikut) console.log(`  ${kind}: ${n}`);
  if (dryRun) {
    console.log("--dry-run: tiada perubahan.");
    process.exit(0);
  }

  const { db } = await import("../lib/db");
  const { analisisMetrics, analisisBreakdown } = await import("../lib/schema");
  const { eq } = await import("drizzle-orm");
  await db.transaction(async (tx) => {
    await tx.delete(analisisMetrics).where(eq(analisisMetrics.modul, "pensijilan"));
    await tx.delete(analisisBreakdown).where(eq(analisisBreakdown.modul, "pensijilan"));
    if (metrics.length) await tx.insert(analisisMetrics).values(metrics);
    if (breakdown.length) await tx.insert(analisisBreakdown).values(breakdown);
  });
  console.log("Disimpan.");
  await revalidateSite(["home"]);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
