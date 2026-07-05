/**
 * Migrasi data Direktori GPICT/DELIMa/GPM daripada Supabase LAMA
 * (needtocombine/DashboardGPMICT) ke DB baharu eUSTP.
 *
 * Sumber: REST PostgREST projek Supabase lama (URL + service key dibaca
 * terus dari .env.local projek lama). Sasaran: DATABASE_URL projek ini.
 *
 * Guna:
 *   npx tsx scripts/migrate-direktori.ts --dry-run   (lapor sahaja, tiada tulis)
 *   npx tsx scripts/migrate-direktori.ts             (tulis sebenar)
 *
 * - Nama sekolah dinormalisasi (buang titik selepas singkatan, ruang berganda)
 *   supaya format seragam — lihat normalizeSchoolName().
 * - schools.website yang sedia ada di DB baharu TIDAK disentuh.
 * - Penunjuk current_version_id dikekalkan; jika null, versi terbaru
 *   yang tidak disorok dipilih.
 */
import "./load-env";
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../lib/schema";

const OLD_ENV_PATH =
  "C:/ClaudeProject/ustpallin1/needtocombine/DashboardGPMICT/.env.local";

const DRY_RUN = process.argv.includes("--dry-run");

/* ---------- Baca env projek lama ---------- */
function readOldEnv(): { url: string; key: string } {
  const raw = readFileSync(OLD_ENV_PATH, "utf8");
  const get = (name: string) => {
    const m = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
    return m ? m[1].trim() : "";
  };
  const url = get("NEXT_PUBLIC_SUPABASE_URL");
  const key = get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Env Supabase lama tidak lengkap");
  return { url, key };
}

/* ---------- Ambil semua baris satu jadual (pagination 1000) ---------- */
async function fetchAll<T>(base: string, key: string, table: string): Promise<T[]> {
  const rows: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const res = await fetch(`${base}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${from}-${from + page - 1}`,
      },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const batch = (await res.json()) as T[];
    rows.push(...batch);
    if (batch.length < page) break;
  }
  return rows;
}

type OldSchool = {
  code: string;
  name: string;
  zone: string;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
};
type OldVersion = {
  id: string;
  school_code: string;
  school_name: string;
  zone: string;
  submitted_at: string;
  submitter_name: string | null;
  submitter_phone: string | null;
  source: string | null;
  is_hidden: boolean;
  created_at: string;
};
type OldRole = { version_id: string; role: "GPICT" | "DELIMA" | "GPM"; teacher_name: string; phone: string };

/* ---------- Normalisasi nama sekolah ----------
 * Format piawai korpus: singkatan padat tanpa titik/kurungan —
 * "SK …", "SMK …", "SJKC …", "SJKT …". Baiki varian janggal:
 *   "SEKOLAH KEBANGSAAN X"  -> "SK X"
 *   "SJK C X" / "SJK(C) X"  -> "SJKC X"   (begitu juga SJKT)
 *   "SMK. X" / "KG. X"      -> tanpa titik
 *   "KPG"                   -> "KG"
 *   kuotasi keriting ’      -> apostrofi lurus '
 *   "METHODIST(ACS)"        -> "METHODIST (ACS)" */
function normalizeSchoolName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/[’‘]/g, "'")
    .replace(/^SEKOLAH KEBANGSAAN\s+/, "SK ")
    .replace(/^SEKOLAH MENENGAH KEBANGSAAN\s+/, "SMK ")
    .replace(/^SJK\s*\(\s*C\s*\)\s*/, "SJKC ")
    .replace(/^SJK\s*\(\s*T\s*\)\s*/, "SJKT ")
    .replace(/^SJK C\s+/, "SJKC ")
    .replace(/^SJK T\s+/, "SJKT ")
    .replace(/^(SMK|SJKC|SJKT|SK|SM|SBP)\.\s*/, "$1 ")
    .replace(/\bKG\.\s*/g, "KG ")
    .replace(/\bKPG\b/g, "KG")
    .replace(/([A-Z])\(/g, "$1 (")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const old = readOldEnv();
  console.log(`Sumber lama: ${old.url}`);

  const [oldSchools, oldVersions, oldRoles] = await Promise.all([
    fetchAll<OldSchool>(old.url, old.key, "schools"),
    fetchAll<OldVersion>(old.url, old.key, "contact_versions"),
    fetchAll<OldRole>(old.url, old.key, "contact_roles"),
  ]);
  console.log(
    `Lama: ${oldSchools.length} sekolah, ${oldVersions.length} versi, ${oldRoles.length} peranan`,
  );

  /* Kesan & lapor nama yang berubah selepas normalisasi */
  const renames: { code: string; from: string; to: string }[] = [];
  for (const s of oldSchools) {
    const to = normalizeSchoolName(s.name);
    if (to !== s.name) renames.push({ code: s.code, from: s.name, to });
  }
  console.log(`\nNama diubah format (${renames.length}):`);
  for (const r of renames) console.log(`  ${r.code}: "${r.from}" -> "${r.to}"`);

  /* Versi tanpa penunjuk semasa → pilih versi terbaru tidak disorok */
  const latestBySchool = new Map<string, OldVersion>();
  for (const v of oldVersions) {
    if (v.is_hidden) continue;
    const cur = latestBySchool.get(v.school_code);
    if (!cur || v.submitted_at > cur.submitted_at) latestBySchool.set(v.school_code, v);
  }

  /* ---------- Sambung DB baharu ---------- */
  const urlNew = process.env.DATABASE_URL;
  if (!urlNew) throw new Error("DATABASE_URL tidak ditetapkan");
  const client = postgres(urlNew, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  const existing = await db.execute(
    sql`select count(*)::int as c from schools`,
  );
  const existingVersions = await db.execute(
    sql`select count(*)::int as c from contact_versions`,
  );
  console.log(
    `\nBaharu (sebelum): ${(existing as unknown as { c: number }[])[0].c} sekolah, ` +
      `${(existingVersions as unknown as { c: number }[])[0].c} versi`,
  );

  if (DRY_RUN) {
    console.log("\n--dry-run: tiada perubahan ditulis.");
    await client.end();
    return;
  }

  await db.transaction(async (tx) => {
    /* 1. schools — upsert TANPA menyentuh website & current_version_id dahulu */
    for (const s of oldSchools) {
      const name = normalizeSchoolName(s.name);
      await tx.execute(sql`
        insert into schools (code, name, zone, created_at, updated_at)
        values (${s.code}, ${name}, ${s.zone}, ${s.created_at}, ${s.updated_at})
        on conflict (code) do update
          set name = excluded.name, zone = excluded.zone, updated_at = excluded.updated_at
      `);
    }

    /* 2. contact_versions — kekalkan id asal supaya sejarah & penunjuk sah */
    for (const v of oldVersions) {
      const schoolName = normalizeSchoolName(v.school_name);
      await tx.execute(sql`
        insert into contact_versions
          (id, school_code, school_name, zone, submitted_at,
           submitter_name, submitter_phone, source, is_hidden, created_at)
        values
          (${v.id}, ${v.school_code}, ${schoolName}, ${v.zone}, ${v.submitted_at},
           ${v.submitter_name}, ${v.submitter_phone}, ${v.source}, ${v.is_hidden}, ${v.created_at})
        on conflict (id) do nothing
      `);
    }

    /* 3. contact_roles */
    for (const r of oldRoles) {
      await tx.execute(sql`
        insert into contact_roles (version_id, role, teacher_name, phone)
        values (${r.version_id}, ${r.role}, ${r.teacher_name}, ${r.phone})
        on conflict (version_id, role) do update
          set teacher_name = excluded.teacher_name, phone = excluded.phone
      `);
    }

    /* 4. current_version_id — ikut penunjuk lama; fallback versi terbaru */
    for (const s of oldSchools) {
      const versionId = s.current_version_id ?? latestBySchool.get(s.code)?.id ?? null;
      if (!versionId) continue;
      await tx.execute(sql`
        update schools set current_version_id = ${versionId} where code = ${s.code}
      `);
    }
  });

  const after = await db.execute(sql`
    select
      (select count(*)::int from schools) as sekolah,
      (select count(*)::int from contact_versions) as versi,
      (select count(*)::int from contact_roles) as peranan,
      (select count(*)::int from schools where current_version_id is not null) as berpenunjuk
  `);
  console.log("\nBaharu (selepas):", (after as unknown as Record<string, number>[])[0]);
  await client.end();
  console.log("Migrasi direktori selesai.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
