/**
 * Isi GP DELIMa yang bertanda "sama seperti di atas" dengan data GPICT
 * sekolah yang sama (versi semasa).
 *
 * Guna:
 *   npx tsx scripts/fix-delima-sama.ts --dry-run
 *   npx tsx scripts/fix-delima-sama.ts
 */
import "./load-env";
import { readFileSync } from "node:fs";
import { eq, and, sql as dsql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/schema";
import { contactRoles, schools } from "../lib/schema";

const DRY_RUN = process.argv.includes("--dry-run");
const SAME_AS_ABOVE = /sama\s*seperti\s*di\s*atas|sama\s*seperti\s*diatas/i;

const OLD_ENV_PATH =
  "C:/ClaudeProject/ustpallin1/needtocombine/DashboardGPMICT/.env.local";

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

type OldSchool = { code: string; name: string; current_version_id: string | null };
type OldRole = {
  version_id: string;
  role: "GPICT" | "DELIMA" | "GPM";
  teacher_name: string;
  phone: string;
};

function isSameAsAbove(text: string): boolean {
  return SAME_AS_ABOVE.test(text.trim());
}

async function listFromOldDb() {
  const old = readOldEnv();
  const [oldSchools, oldRoles] = await Promise.all([
    fetchAll<OldSchool>(old.url, old.key, "schools"),
    fetchAll<OldRole>(old.url, old.key, "contact_roles"),
  ]);
  const rolesByVersion: Record<string, Partial<Record<OldRole["role"], OldRole>>> = {};
  for (const r of oldRoles) {
    if (!rolesByVersion[r.version_id]) rolesByVersion[r.version_id] = {};
    rolesByVersion[r.version_id][r.role] = r;
  }
  const hits: Array<{
    code: string;
    name: string;
    versionId: string;
    gpict: { teacherName: string; phone: string };
  }> = [];
  for (const s of oldSchools) {
    const vid = s.current_version_id;
    if (!vid) continue;
    const rr = rolesByVersion[vid];
    const delima = rr?.DELIMA;
    const gpict = rr?.GPICT;
    if (!delima || !gpict) continue;
    if (!isSameAsAbove(delima.teacher_name) && !isSameAsAbove(delima.phone)) continue;
    hits.push({
      code: s.code,
      name: s.name,
      versionId: vid,
      gpict: { teacherName: gpict.teacher_name, phone: gpict.phone },
    });
  }
  return hits;
}

async function listFromNewDb() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1, connect_timeout: 15 });
  const db = drizzle(client, { schema });
  try {
    const rows = await db.execute<{
      code: string;
      name: string;
      version_id: string;
      delima_name: string;
      delima_phone: string;
      gpict_name: string;
      gpict_phone: string;
    }>(dsql`
      SELECT s.code, s.name, cv.id AS version_id,
             cr_d.teacher_name AS delima_name, cr_d.phone AS delima_phone,
             cr_g.teacher_name AS gpict_name, cr_g.phone AS gpict_phone
      FROM schools s
      JOIN contact_versions cv ON cv.id = s.current_version_id
      JOIN contact_roles cr_d ON cr_d.version_id = cv.id AND cr_d.role = 'DELIMA'
      JOIN contact_roles cr_g ON cr_g.version_id = cv.id AND cr_g.role = 'GPICT'
      ORDER BY s.code
    `);
    return rows.filter(
      (r) => isSameAsAbove(r.delima_name) || isSameAsAbove(r.delima_phone),
    ).map((r) => ({
      code: r.code,
      name: r.name,
      versionId: r.version_id,
      gpict: { teacherName: r.gpict_name, phone: r.gpict_phone },
      delima: { teacherName: r.delima_name, phone: r.delima_phone },
    }));
  } finally {
    await client.end({ timeout: 5 });
  }
}

async function applyFix(
  hits: Array<{
    code: string;
    name: string;
    versionId: string;
    gpict: { teacherName: string; phone: string };
  }>,
  label: string,
) {
  if (hits.length === 0) {
    console.log(`[${label}] Tiada sekolah dengan "sama seperti di atas".`);
    return 0;
  }
  console.log(`[${label}] ${hits.length} sekolah perlu dikemas kini:`);
  for (const h of hits) {
    console.log(
      `  ${h.code} ${h.name}: DELIMa <- GPICT "${h.gpict.teacherName}" / ${h.gpict.phone}`,
    );
  }
  if (DRY_RUN) return hits.length;

  const client = postgres(process.env.DATABASE_URL!, { max: 1, connect_timeout: 15 });
  const db = drizzle(client, { schema });
  try {
    await db.transaction(async (tx) => {
      for (const h of hits) {
        await tx
          .update(contactRoles)
          .set({
            teacherName: h.gpict.teacherName,
            phone: h.gpict.phone,
          })
          .where(
            and(eq(contactRoles.versionId, h.versionId), eq(contactRoles.role, "DELIMA")),
          );
        await tx
          .update(schools)
          .set({ updatedAt: new Date() })
          .where(eq(schools.code, h.code));
      }
    });
    console.log(`[${label}] Kemaskini selesai.`);
  } finally {
    await client.end({ timeout: 5 });
  }
  return hits.length;
}

async function applyFixOldDb(
  hits: Array<{
    code: string;
    name: string;
    versionId: string;
    gpict: { teacherName: string; phone: string };
  }>,
) {
  if (hits.length === 0 || DRY_RUN) return;
  const old = readOldEnv();
  for (const h of hits) {
    const res = await fetch(
      `${old.url}/rest/v1/contact_roles?version_id=eq.${h.versionId}&role=eq.DELIMA`,
      {
        method: "PATCH",
        headers: {
          apikey: old.key,
          Authorization: `Bearer ${old.key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          teacher_name: h.gpict.teacherName,
          phone: h.gpict.phone,
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`PATCH ${h.code}: HTTP ${res.status} ${await res.text()}`);
    }
  }
  console.log("[DB lama] Kemaskini selesai.");
}

async function main() {
  console.log(DRY_RUN ? "--dry-run" : "Tulis sebenar");

  let newHits: Awaited<ReturnType<typeof listFromNewDb>> = [];
  try {
    newHits = await listFromNewDb();
  } catch (e) {
    console.warn("DB baharu tidak dapat dihubungi:", (e as Error).message);
  }

  const oldHits = await listFromOldDb();

  if (newHits.length > 0) {
    await applyFix(newHits, "DB baharu");
  } else if (oldHits.length > 0) {
    console.log("[DB baharu] Tiada padanan — cuba DB lama.");
    await applyFix(oldHits, "DB lama (dry listing)");
    await applyFixOldDb(oldHits);
  } else {
    console.log("Tiada sekolah dengan teks 'sama seperti di atas' di kedua-dua DB.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
