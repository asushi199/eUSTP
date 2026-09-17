"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { backupToDriveNow } from "@/lib/actions/backup";

type Props = {
  driveReady: boolean;
  cronReady: boolean;
  scheduleText: string;
  last: {
    ok: boolean;
    atText: string;
    fileName: string;
    sizeText: string;
    triggerText: string;
    publicUrl?: string;
    error?: string;
  } | null;
};

export default function BackupPanel({ driveReady, cronReady, scheduleText, last }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function runBackup() {
    setMsg(null);
    startTransition(async () => {
      const res = await backupToDriveNow();
      if (res.ok) {
        setMsg({ type: "ok", text: "Sandaran berjaya dimuat naik ke Google Drive." });
        router.refresh();
      } else {
        setMsg({ type: "err", text: res.error ?? "Sandaran gagal." });
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Status sandaran terakhir */}
      <section className="card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
          Sandaran terakhir
        </h2>
        {last ? (
          <div className="mt-3 space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span
                className="status-dot"
                style={{ background: last.ok ? "var(--primary, #024ad8)" : "#b91c1c" }}
                aria-hidden
              />
              <span className="font-semibold text-ink">
                {last.ok ? "Berjaya" : "Gagal"}
              </span>
              <span className="text-graphite">· {last.atText}</span>
            </p>
            <p className="text-graphite">
              {last.fileName} · {last.sizeText} · {last.triggerText}
            </p>
            {last.ok && last.publicUrl ? (
              <a href={last.publicUrl} target="_blank" rel="noreferrer" className="link-blue">
                Buka di Google Drive
              </a>
            ) : null}
            {!last.ok && last.error ? (
              <p className="text-bloom-deep">{last.error}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-graphite">Belum ada sandaran direkodkan.</p>
        )}
      </section>

      {/* Tindakan manual */}
      <section className="card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
          Sandar sekarang
        </h2>
        <p className="mt-2 text-sm text-graphite">
          Muat turun satu salinan luar-talian ke komputer anda, atau simpan terus
          ke Google Drive. Fail ialah ZIP (satu JSON setiap jadual).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/admin/backup/download"
            className="btn-outline-ink"
            // biar pelayar memproses muat turun; jangan cache
          >
            Muat turun ZIP
          </a>
          <button
            type="button"
            onClick={runBackup}
            disabled={pending || !driveReady}
            className="btn-primary disabled:opacity-50"
          >
            {pending ? "Menyandar…" : "Sandar ke Google Drive"}
          </button>
        </div>
        {!driveReady ? (
          <p className="mt-3 text-sm text-bloom-deep">
            Google Drive belum dikonfigurasi (GAS_WEB_APP_URL / GAS_UPLOAD_SECRET).
            Butang muat turun masih berfungsi.
          </p>
        ) : null}
        {msg ? (
          <p
            className={`mt-3 text-sm ${
              msg.type === "ok" ? "text-ink" : "text-bloom-deep"
            }`}
          >
            {msg.text}
          </p>
        ) : null}
      </section>

      {/* Sandaran automatik */}
      <section className="card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
          Sandaran automatik
        </h2>
        <p className="mt-2 text-sm text-graphite">{scheduleText}</p>
        {!cronReady ? (
          <p className="mt-3 text-sm text-bloom-deep">
            CRON_SECRET belum ditetapkan — sandaran automatik tidak akan berjalan
            sehingga ia dikonfigurasi pada pelayan (Vercel).
          </p>
        ) : (
          <p className="mt-3 text-sm text-graphite">
            Aktif. Fail disusun ke folder <span className="font-medium text-ink">_backup/tahun/bulan</span> di Google Drive.
          </p>
        )}
      </section>
    </div>
  );
}
