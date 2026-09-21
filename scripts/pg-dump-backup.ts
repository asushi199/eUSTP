/**
 * Sandaran SQL penuh (pg_dump). Vercel tidak boleh jalankan ini — guna GitHub Actions
 * (workflow backup-pgdump-monthly) atau mesin tempatan.
 */
import { readFileSync } from "node:fs";
import "./load-env";
import { runPgDump } from "../lib/backup/pgdump";
import { isGasStorageConfigured, uploadFileViaGas } from "../lib/gas-upload";

const APP_SLUG = "eustp";
const upload = process.argv.includes("--upload");

async function main() {
  const art = runPgDump(APP_SLUG);
  console.log("Sandaran SQL penuh berjaya:");
  console.log(" ", art.sqlPath);
  console.log(" ", art.gzPath, `(${(art.gzSizeBytes / 1024).toFixed(1)} KB gzip)`);

  if (!upload) {
    console.log("\nMuat naik Drive: npm run db:backup-pgdump:upload");
    console.log("Automatik bulanan: GitHub Actions → Sandaran pg_dump bulanan.");
    return;
  }

  if (!isGasStorageConfigured()) {
    console.error("GAS_WEB_APP_URL / GAS_UPLOAD_SECRET belum ditetapkan.");
    process.exit(1);
  }

  const buffer = readFileSync(art.gzPath);
  const { path: drivePath, publicUrl } = await uploadFileViaGas(
    { name: art.gzFileName, type: "application/gzip", buffer },
    { fileName: art.gzFileName, subPath: art.subPath },
  );
  console.log("\nMuat naik Google Drive berjaya:");
  console.log(" ", drivePath);
  console.log(" ", publicUrl);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
