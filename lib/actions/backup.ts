"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import { createBackupZip } from "@/lib/backup/dump";
import { storeBackupToDrive } from "@/lib/backup/store";

/** Butang admin: jana sandaran & muat naik ke Google Drive sekarang. */
export async function backupToDriveNow(): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    const backup = await createBackupZip();
    const info = await storeBackupToDrive(backup, "manual");
    revalidatePath("/admin/backup");
    if (!info.ok) return { ok: false, error: info.error ?? "Sandaran ke Drive gagal." };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Sandaran gagal.",
    };
  }
}
