import { formatInTimeZone } from "date-fns-tz";
import BackupPanel from "@/components/admin/BackupPanel";
import BackupPgDumpSection from "@/components/admin/BackupPgDumpSection";
import { readLastBackup } from "@/lib/backup/store";
import { readLastPgDumpBackup } from "@/lib/backup/pgdump-last";
import { isGasStorageConfigured } from "@/lib/gas-upload";
import { requireAdmin } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const TZ = "Asia/Kuala_Lumpur";

const TRIGGER_LABEL: Record<"manual" | "cron", string> = {
  manual: "manual",
  cron: "automatik",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function AdminBackupPage() {
  await requireAdmin();

  const [record, pgdump, driveReady] = await Promise.all([
    readLastBackup(),
    readLastPgDumpBackup(),
    Promise.resolve(isGasStorageConfigured()),
  ]);
  const cronReady = !!process.env.CRON_SECRET?.trim();

  const last = record
    ? {
        ok: record.ok,
        atText: formatInTimeZone(new Date(record.at), TZ, "d MMM yyyy, h:mm a"),
        fileName: record.fileName,
        sizeText: formatSize(record.sizeBytes),
        triggerText: `${record.rowCount} baris · ${TRIGGER_LABEL[record.trigger]}`,
        publicUrl: record.publicUrl,
        error: record.error,
      }
    : null;

  const pgdumpAtText = pgdump
    ? formatInTimeZone(new Date(pgdump.at), TZ, "d MMM yyyy, h:mm a")
    : null;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Sandaran Data</h1>
      <p className="mt-1 text-sm text-graphite">
        Sandaran logik harian dan sandaran SQL penuh bulanan. Kandungan sensitif; simpan dengan
        selamat.
      </p>

      <BackupPanel
        driveReady={driveReady}
        cronReady={cronReady}
        scheduleText="Dijadualkan setiap hari pada kira-kira 2:00 pagi (waktu Malaysia) dan dimuat naik ke Google Drive."
        last={last}
      />

      <BackupPgDumpSection atText={pgdumpAtText} />
    </>
  );
}
