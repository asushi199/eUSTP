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

const DEFAULT_SITE = "https://nexa-ustpmanjung.vercel.app";

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
    const res = await fetch(`${site}/api/revalidate${qs ? `?${qs}` : ""}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[cache] ${site}/api/revalidate → HTTP ${res.status}. Tekan 'Kosongkan cache' di /admin/backup.`);
      return false;
    }
    const body = (await res.json()) as { tags?: string[] };
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
  revalidateSite(process.argv.slice(2)).then((ok) => process.exit(ok ? 0 : 1));
}
