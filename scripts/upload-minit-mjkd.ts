import "./load-env";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

/**
 * Muat naik PDF minit MJKD ke Supabase Storage dan simpan URL pada mesyuarat.
 * Sama seperti butang "Muat naik minit" di /admin/mjkd/[id] (tab Tetapan), untuk kegunaan
 * terminal apabila admin belum log masuk / belum deploy.
 *
 * Guna:
 *   npx tsx scripts/upload-minit-mjkd.ts --tahun 2026 --bil 1 --fail "MJKD/minit.pdf" [--dry-run]
 */

const MAKS_BYTE = 8 * 1024 * 1024;

function arg(nama: string): string {
  const i = process.argv.indexOf(`--${nama}`);
  return i >= 0 ? (process.argv[i + 1] ?? "").trim() : "";
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const tahun = Number(arg("tahun"));
  const bil = Number(arg("bil"));
  const fail = arg("fail");
  if (!Number.isInteger(tahun) || !Number.isInteger(bil) || !fail) {
    throw new Error('Guna: --tahun 2026 --bil 1 --fail "laluan/minit.pdf" [--dry-run]');
  }

  const buffer = await readFile(fail);
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new Error(`${fail} bukan fail PDF.`);
  }
  if (buffer.length > MAKS_BYTE) {
    throw new Error(`${fail} melebihi 8 MB (${(buffer.length / 1048576).toFixed(1)} MB).`);
  }

  const { db } = await import("../lib/db");
  const { mjkdMesyuarat } = await import("../lib/schema");
  const { and, eq } = await import("drizzle-orm");
  const { uploadPublicStorageObject } = await import("../lib/tempahan/room-photos");

  const [mesyuarat] = await db
    .select()
    .from(mjkdMesyuarat)
    .where(and(eq(mjkdMesyuarat.tahun, tahun), eq(mjkdMesyuarat.bil, bil)))
    .limit(1);
  if (!mesyuarat) {
    throw new Error(`Mesyuarat Bil.${bil}/${tahun} tidak dijumpai. Jalankan seed dahulu.`);
  }

  const path = `mjkd/${tahun}-bil${bil}/minit-${Date.now()}.pdf`;
  console.log(`Mesyuarat : Bil.${bil}/${tahun} (${mesyuarat.id})`);
  console.log(`Fail      : ${basename(fail)} (${(buffer.length / 1048576).toFixed(2)} MB)`);
  console.log(`Laluan    : ${path}`);
  if (mesyuarat.minitUrl) console.log(`Minit lama: ${mesyuarat.minitUrl} (akan diganti)`);
  if (dryRun) {
    console.log("--dry-run: tiada muat naik dibuat.");
    process.exit(0);
  }

  const url = await uploadPublicStorageObject(
    path,
    { name: basename(fail), type: "application/pdf", buffer },
    "Muat naik minit MJKD",
  );
  await db
    .update(mjkdMesyuarat)
    .set({ minitUrl: url, minitStoragePath: path, updatedAt: new Date() })
    .where(eq(mjkdMesyuarat.id, mesyuarat.id));
  console.log(`Siap. URL minit: ${url}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
