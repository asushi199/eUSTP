/**
 * Tulis GitHub Actions secrets sandaran pg_dump untuk eUSTP.
 * Jalankan: npx tsx scripts/set-github-backup-secrets.ts
 */
import { execSync } from "node:child_process";
import "./load-env";
import { normalizeDatabaseUrl } from "../lib/database-url";

const REPO = "asushi199/eUSTP";

function setSecret(name: string, value: string) {
  execSync(`gh secret set ${name} -R ${REPO}`, { input: value, stdio: ["pipe", "pipe", "pipe"] });
  console.log(`OK ${name}`);
}

/** Direct 5432 daripada DATABASE_URL pooler jika PGDUMP_DATABASE_URL tiada. */
function pgdumpUrl(): string {
  const direct = process.env.PGDUMP_DATABASE_URL?.trim();
  if (direct) return normalizeDatabaseUrl(direct);

  const url = normalizeDatabaseUrl(process.env.DATABASE_URL);
  const u = new URL(url);
  const ref = u.username.startsWith("postgres.") ? u.username.slice("postgres.".length) : u.username;
  if (!ref || ref === u.username) {
    throw new Error(
      "Tetapkan PGDUMP_DATABASE_URL dalam .env.local (Direct db.xxx.supabase.co:5432)",
    );
  }
  u.username = "postgres";
  u.hostname = `db.${ref}.supabase.co`;
  u.port = "5432";
  u.search = "";
  return u.toString();
}

function main() {
  const gasUrl = process.env.GAS_WEB_APP_URL?.trim();
  const gasSecret = process.env.GAS_UPLOAD_SECRET?.trim();
  if (!gasUrl || !gasSecret) throw new Error("GAS_WEB_APP_URL / GAS_UPLOAD_SECRET kosong");

  setSecret("PGDUMP_DATABASE_URL", pgdumpUrl());
  setSecret("GAS_WEB_APP_URL", gasUrl);
  setSecret("GAS_UPLOAD_SECRET", gasSecret);
  console.log(`Selesai — repo ${REPO}`);
}

main();
