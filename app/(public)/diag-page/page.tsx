import { connect } from "node:net";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Diagnostik sementara (versi HALAMAN) — ujian berlapis untuk menentukan
 * lapisan mana yang gagal dalam konteks render halaman. BUANG selepas selesai.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Check = { name: string; ok: boolean; ms: number; detail: string };

async function run(name: string, timeoutMs: number, fn: () => Promise<string>): Promise<Check> {
  const t0 = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`TIMEOUT ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    const detail = await Promise.race([fn(), timeout]);
    return { name, ok: true, ms: Date.now() - t0, detail };
  } catch (e) {
    return {
      name,
      ok: false,
      ms: Date.now() - t0,
      detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** TCP mentah ke pooler — adakah rangkaian halaman boleh sampai langsung? */
function rawTcp(host: string, port: number, ms = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const sock = connect({ host, port });
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error(`TCP connect timeout ${ms}ms`));
    }, ms);
    sock.once("connect", () => {
      clearTimeout(timer);
      const took = Date.now() - t0;
      sock.destroy();
      resolve(`connected in ${took}ms`);
    });
    sock.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export default async function DiagPage() {
  const dbUrl = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "");
    } catch {
      return null;
    }
  })();
  const host = dbUrl?.hostname ?? "";
  const port = Number(dbUrl?.port || 5432);

  const checks: Check[] = [];

  // 1. TCP mentah ke pooler (tiada driver terlibat)
  checks.push(await run("tcp_pooler", 8000, () => rawTcp(host, port)));

  // 2. Egress HTTPS umum
  checks.push(
    await run("https_egress", 8000, async () => {
      const r = await fetch("https://www.gstatic.com/generate_204", { cache: "no-store" });
      return `status=${r.status}`;
    }),
  );

  // 3. Klien postgres BAHARU (bukan singleton global) — connect_timeout 8s
  checks.push(
    await run("fresh_client_select1", 15000, async () => {
      const fresh = postgres(process.env.DATABASE_URL!, {
        max: 1,
        prepare: false,
        connect_timeout: 8,
        idle_timeout: 2,
      });
      try {
        await fresh`select 1`;
        return "ok";
      } finally {
        await fresh.end({ timeout: 2 }).catch(() => undefined);
      }
    }),
  );

  // 4. Singleton global (lib/db) — biar CONNECT_TIMEOUT 10s driver timbul
  checks.push(
    await run("global_db_select1", 15000, async () => {
      await db.execute(sql`select 1`);
      return "ok";
    }),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 font-mono text-sm">
      <h1 className="text-lg font-bold">diag-page v2</h1>
      <p className="mt-1 text-xs">
        region={process.env.VERCEL_REGION ?? "?"} host={host}:{port}
      </p>
      <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-cloud p-4">
        {JSON.stringify(checks, null, 2)}
      </pre>
    </div>
  );
}
