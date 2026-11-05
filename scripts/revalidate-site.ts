/**
 * Minta laman produksi membatalkan cache data (POST /api/revalidate).
 * Dipanggil di hujung skrip import supaya data baharu muncul serta-merta
 * walaupun cache 24 jam. Gagal = amaran sahaja (import tetap berjaya).
 *
 * CLI:  npm run cache:clear              → semua tag
 *       npm run cache:clear -- home ains → tag tertentu
 *
 * Perlu CRON_SECRET dalam .env.local (sama dengan Vercel). URL laman:
 * NEXA_SITE_URL (lalai https://nexa-ustpmanjung.vercel.app).
 */
import "./load-env";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const DEFAULT_SITE = "https://nexa-ustpmanjung.vercel.app";

/**
 * POST tanpa keep-alive (agent: false). `fetch` meninggalkan soket undici terbuka dan
 * `process.exit()` selepasnya mencetus assertion libuv di Windows (exit 127).
 */
function postNoKeepAlive(url: string, secret: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = (u.protocol === "https:" ? httpsRequest : httpRequest)(
      u,
      { method: "POST", agent: false, headers: { Authorization: `Bearer ${secret}` }, timeout: 15_000 },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c: string) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("tamat masa 15s")));
    req.on("error", reject);
    req.end();
  });
}

export async function revalidateSite(tags: string[] = []): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  const site = (process.env.NEXA_SITE_URL?.trim() || DEFAULT_SITE).replace(/\/$/, "");
  if (!secret) {
    console.warn(
      "[cache] CRON_SECRET tiada dalam .env.local — cache laman TIDAK dikosongkan. " +
        "Tekan 'Kosongkan cache' di /admin/backup.",
    );
    return false;
  }
  const qs = tags.map((t) => `tag=${encodeURIComponent(t)}`).join("&");
  try {
    const res = await postNoKeepAlive(`${site}/api/revalidate${qs ? `?${qs}` : ""}`, secret);
    if (res.status !== 200) {
      console.warn(`[cache] ${site}/api/revalidate → HTTP ${res.status}. Tekan 'Kosongkan cache' di /admin/backup.`);
      return false;
    }
    const body = JSON.parse(res.body) as { tags?: string[] };
    console.log(`[cache] Cache laman dikosongkan: ${(body.tags ?? []).join(", ")}`);
    return true;
  } catch (e) {
    console.warn(
      `[cache] Gagal hubungi ${site}: ${e instanceof Error ? e.message : e}. Tekan 'Kosongkan cache' di /admin/backup.`,
    );
    return false;
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/revalidate-site.ts")) {
  revalidateSite(process.argv.slice(2)).then((ok) => {
    process.exitCode = ok ? 0 : 1;
  });
}
