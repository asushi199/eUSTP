import { createBackupZip } from "@/lib/backup/dump";
import { storeBackupToDrive } from "@/lib/backup/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Titik hujung sandaran automatik. Dipanggil oleh Vercel Cron (lihat
 * vercel.json), yang menghantar header `Authorization: Bearer <CRON_SECRET>`.
 * Bukan di bawah /admin, jadi tidak melalui middleware auth — dilindungi
 * sepenuhnya oleh CRON_SECRET. Boleh juga dicetus oleh cron luaran/GitHub
 * Actions dengan header yang sama.
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
    const backup = await createBackupZip();
    const info = await storeBackupToDrive(backup, "cron");
    return Response.json(
      {
        ok: info.ok,
        fileName: info.fileName,
        sizeBytes: info.sizeBytes,
        tableCount: info.tableCount,
        rowCount: info.rowCount,
        error: info.error,
      },
      { status: info.ok ? 200 : 502 },
    );
  } catch (error) {
    console.error("[cron/backup]", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Sandaran gagal." },
      { status: 500 },
    );
  }
}
