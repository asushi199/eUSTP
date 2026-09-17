/**
 * Simpan ZIP sandaran ke Google Drive (via GAS Web App) dan rekod status
 * sandaran terakhir dalam `app_settings` (tiada migrasi baharu diperlukan —
 * fail ZIP di Drive itu sendiri ialah sejarah sandaran).
 *
 * Nota kuota: GAS mengehadkan satu fail ≤ 8MB. ZIP DEFLATE biasanya jauh lebih
 * kecil daripada dump mentah, tetapi jika melebihi, `uploadFileViaGas` melontar
 * ralat yang kita tangkap dan rekod (ok:false) supaya UI/cron tidak tergantung.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/schema";
import { isGasStorageConfigured, uploadFileViaGas } from "@/lib/gas-upload";
import type { BackupResult } from "./dump";

const LAST_BACKUP_KEY = "backup:last";

export type LastBackup = {
  at: string; // ISO
  fileName: string;
  publicUrl?: string;
  path?: string;
  sizeBytes: number;
  tableCount: number;
  rowCount: number;
  trigger: "manual" | "cron";
  ok: boolean;
  error?: string;
};

export async function readLastBackup(): Promise<LastBackup | null> {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, LAST_BACKUP_KEY),
  });
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as LastBackup;
  } catch {
    return null;
  }
}

async function writeLastBackup(info: LastBackup): Promise<void> {
  const value = JSON.stringify(info);
  await db
    .insert(appSettings)
    .values({ key: LAST_BACKUP_KEY, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: sql`now()` },
    });
}

export async function storeBackupToDrive(
  backup: BackupResult,
  trigger: "manual" | "cron",
): Promise<LastBackup> {
  const base = {
    at: new Date().toISOString(),
    fileName: backup.fileName,
    sizeBytes: backup.buffer.byteLength,
    tableCount: backup.tableCount,
    rowCount: backup.rowCount,
    trigger,
  } as const;

  if (!isGasStorageConfigured()) {
    const info: LastBackup = {
      ...base,
      ok: false,
      error:
        "Google Drive (GAS) belum dikonfigurasi — set GAS_WEB_APP_URL dan GAS_UPLOAD_SECRET.",
    };
    await writeLastBackup(info);
    return info;
  }

  try {
    const { path, publicUrl } = await uploadFileViaGas(
      { name: backup.fileName, type: "application/zip", buffer: backup.buffer },
      { fileName: backup.fileName, subPath: backup.subPath },
    );
    const info: LastBackup = { ...base, ok: true, path, publicUrl };
    await writeLastBackup(info);
    return info;
  } catch (error) {
    const info: LastBackup = {
      ...base,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    await writeLastBackup(info);
    return info;
  }
}
