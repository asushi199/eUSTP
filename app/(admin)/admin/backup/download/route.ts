import { requireAdmin } from "@/lib/rbac";
import { createBackupZip } from "@/lib/backup/dump";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Muat turun terus ZIP sandaran ke komputer admin (salinan luar-talian). */
export async function GET() {
  await requireAdmin(); // redirect jika bukan Admin (middleware sudah gate sesi staf)
  try {
    const backup = await createBackupZip();
    return new Response(new Uint8Array(backup.buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${backup.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[admin/backup/download]", error);
    return Response.json(
      { error: "Sandaran tidak dapat dijana. Sila cuba lagi." },
      { status: 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
