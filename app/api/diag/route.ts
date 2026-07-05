import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, withDbTimeout } from "@/lib/db";
import { pkgs, schools, laporanPss } from "@/lib/schema";

/**
 * Diagnostik sementara — jalankan setiap jenis query dengan timeout 6s dan
 * laporkan keputusan/ralat sebenar. BUANG selepas isu produksi selesai.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Check = { name: string; ok: boolean; ms: number; detail: string };

async function run(name: string, fn: () => Promise<string>): Promise<Check> {
  const t0 = Date.now();
  try {
    const detail = await withDbTimeout(fn(), 6000);
    return { name, ok: true, ms: Date.now() - t0, detail };
  } catch (e) {
    return {
      name,
      ok: false,
      ms: Date.now() - t0,
      detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}

export async function GET() {
  const dbHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").host;
    } catch {
      return "unparseable";
    }
  })();

  const checks: Check[] = [];
  // 1. raw execute (sama seperti /api/health yang berfungsi)
  checks.push(
    await run("execute_select1", async () => {
      await db.execute(sql`select 1`);
      return "ok";
    }),
  );
  // 2. query builder .select() (corak halaman /tempahan yang tergantung)
  checks.push(
    await run("select_pkgs", async () => {
      const r = await db.select({ id: pkgs.id }).from(pkgs);
      return `rows=${r.length}`;
    }),
  );
  // 3. relational query API (corak /laporan-pss)
  checks.push(
    await run("findFirst_schools", async () => {
      const r = await db.query.schools.findFirst();
      return r ? `row=${r.code}` : "empty";
    }),
  );
  // 4. aggregate (corak statistik halaman utama)
  checks.push(
    await run("aggregate_pss", async () => {
      const [r] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(laporanPss);
      return `count=${r?.n ?? "UNDEFINED_ROW"}`;
    }),
  );
  // 5. select kedua selepas select pertama (kesan isu selepas query pertama)
  checks.push(
    await run("select_pkgs_again", async () => {
      const r = await db.select({ id: pkgs.id }).from(pkgs);
      return `rows=${r.length}`;
    }),
  );

  return NextResponse.json(
    {
      dbHost,
      vercel: process.env.VERCEL === "1",
      region: process.env.VERCEL_REGION ?? null,
      checks,
      ts: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
