import { sql } from "drizzle-orm";
import { db, withDbTimeout } from "@/lib/db";
import { pkgs } from "@/lib/schema";

/**
 * Diagnostik sementara (versi HALAMAN) — query yang sama seperti /api/diag
 * tetapi dijalankan dalam konteks render halaman RSC. BUANG selepas selesai.
 */

export const dynamic = "force-dynamic";

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

export default async function DiagPage() {
  const checks: Check[] = [];
  checks.push(
    await run("page_execute_select1", async () => {
      await db.execute(sql`select 1`);
      return "ok";
    }),
  );
  checks.push(
    await run("page_select_pkgs", async () => {
      const r = await db.select({ id: pkgs.id }).from(pkgs);
      return `rows=${r.length}`;
    }),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 font-mono text-sm">
      <h1 className="text-lg font-bold">diag-page</h1>
      <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-cloud p-4">
        {JSON.stringify(checks, null, 2)}
      </pre>
    </div>
  );
}
