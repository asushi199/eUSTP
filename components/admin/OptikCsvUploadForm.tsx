"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadOptikSnapshot } from "@/lib/actions/analisis-optik";

export default function OptikCsvUploadForm({ today }: { today: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await uploadOptikSnapshot(fd);
      if (!res.ok) {
        setError(res.error ?? "Muat naik gagal.");
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="optik-file">
          Fail CSV / Excel
        </label>
        <input
          id="optik-file"
          name="file"
          type="file"
          required
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="input"
        />
        <p className="mt-1 text-xs text-graphite">
          Utamakan CSV senarai guru (PPD, Sekolah, Nama, Email, Status PLC AI) — sekolah
          dijumlah automatik dan nama guru boleh diklik. CSV paparan daerah (✓ / ∑) juga
          diterima, tetapi tiada senarai guru.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="optik-captured">
          Tarikh data
        </label>
        <input
          id="optik-captured"
          type="date"
          name="capturedOn"
          required
          defaultValue={today}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="optik-label">
          Label carta
        </label>
        <input
          id="optik-label"
          name="chartLabel"
          className="input"
          placeholder="Cth. Sep 2026"
        />
        <p className="mt-1 text-xs text-graphite">Kosongkan untuk label ikut bulan tarikh.</p>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Memuat naik…" : "Muat naik & kemas kini"}
        </button>
        {error ? <p className="mt-2 text-sm text-bloom-deep">{error}</p> : null}
      </div>
    </form>
  );
}
