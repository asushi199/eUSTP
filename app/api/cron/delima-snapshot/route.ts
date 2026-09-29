import { revalidatePath } from "next/cache";
import { getDelimaConfig } from "@/lib/analisis/queries";
import { captureDelimaSnapshot } from "@/lib/analisis/delima-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Snapshot DELIMa automatik. Vercel Cron memanggil harian (lihat vercel.json)
 * dengan `Authorization: Bearer <CRON_SECRET>`. Satu snapshot bagi setiap
 * tempoh data sumber: panggilan berulang dalam tempoh sama hanya mengemas kini.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET tidak ditetapkan pada pelayan." },
      { status: 500 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cfg = await getDelimaConfig();
    const result = await captureDelimaSnapshot(cfg.url, cfg.daerah);
    if (result.ok) {
      revalidatePath("/");
      revalidatePath("/analisis");
    }
    return Response.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    console.error("[cron/delima-snapshot]", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Snapshot gagal." },
      { status: 500 },
    );
  }
}
