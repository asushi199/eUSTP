"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTebusBukuCsv } from "@/lib/actions/tebus-buku";
import {
  parseManjungCsv,
  serializeManjungCsv,
  sourcedAtFromFilename,
  summarizeTebusBuku,
  TebusBukuCsvError,
  type TebusBukuImportSummary,
} from "@/lib/tebus-buku/csv";
import { formatCount, formatTarikhSnapshot } from "@/lib/tebus-buku/format";

const MAX_LOCAL_BYTES = 40 * 1024 * 1024;

export default function TebusBukuCsvUpload({ today }: { today: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reading, setReading] = useState(false);
  const [sourcedAt, setSourcedAt] = useState(today);
  const [payload, setPayload] = useState<string | null>(null);
  const [summary, setSummary] = useState<TebusBukuImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    setError(null);
    setDone(null);
    setPayload(null);
    setSummary(null);
    if (!file) return;
    if (file.size > MAX_LOCAL_BYTES) {
      setError("Fail melebihi 40MB.");
      return;
    }
    setReading(true);
    try {
      const rows = parseManjungCsv(await file.text());
      if (rows.length === 0) {
        setError("Tiada rekod PPD MANJUNG dalam fail ini.");
        return;
      }
      setSummary(summarizeTebusBuku(rows));
      setPayload(serializeManjungCsv(rows));
      const fromName = sourcedAtFromFilename(file.name);
      if (fromName) setSourcedAt(fromName);
    } catch (caught) {
      setError(caught instanceof TebusBukuCsvError ? caught.message : "Fail tidak dapat dibaca.");
    } finally {
      setReading(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payload || !summary || reading || pending) return;
    const confirmed = window.confirm(
      `Ganti data tebus buku Manjung dengan ${formatCount(summary.pelajar)} pelajar (${formatCount(summary.sekolah)} sekolah)? Data sedia ada akan diganti.`,
    );
    if (!confirmed) return;

    const form = event.currentTarget;
    setError(null);
    setDone(null);
    const body = new FormData();
    body.set("file", new File([payload], "manjung.csv", { type: "text/csv" }));
    body.set("sourcedAt", sourcedAt);

    startTransition(async () => {
      try {
        const result = await importTebusBukuCsv(body);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        const tarikh = formatTarikhSnapshot(result.sourcedAt) ?? result.sourcedAt;
        setDone(
          `Berjaya. ${formatCount(result.pelajar)} pelajar, ${formatCount(result.sekolah)} sekolah. Data setakat ${tarikh}.`,
        );
        setPayload(null);
        setSummary(null);
        form.reset();
        router.refresh();
      } catch {
        setError("Muat naik gagal. Cuba lagi.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="tebus-buku-file">
          Fail CSV
        </label>
        <input
          id="tebus-buku-file"
          name="file"
          type="file"
          required
          accept=".csv,text/csv"
          className="input"
          disabled={pending || reading}
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
          }}
        />
        <p className="mt-1 text-xs text-graphite">
          Eksport Dashboard Operasi, jadual Butiran Tebus/Guna (Murid). Fail penuh negeri boleh
          dipilih; hanya PPD MANJUNG disimpan.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="tebus-buku-date">
          Tarikh data
        </label>
        <input
          id="tebus-buku-date"
          type="date"
          name="sourcedAt"
          required
          value={sourcedAt}
          onChange={(event) => setSourcedAt(event.target.value)}
          className="input"
        />
        <p className="mt-1 text-xs text-graphite">Tarikh ini dipaparkan pada halaman awam.</p>
      </div>
      <div className="sm:col-span-2">
        {reading ? <p className="text-sm text-graphite">Membaca fail…</p> : null}
        {summary ? (
          <div className="rounded-lg border border-fog bg-cloud px-4 py-3 text-sm">
            <p className="font-semibold text-ink">PPD MANJUNG dalam fail ini</p>
            <p className="mt-1 text-graphite">
              {formatCount(summary.pelajar)} pelajar · {formatCount(summary.sekolah)} sekolah ·{" "}
              {formatCount(summary.sudahTebus)} sudah tebus · {formatCount(summary.sudahGuna)} sudah
              guna
            </p>
          </div>
        ) : null}
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending || reading || !payload} className="btn-primary">
          {pending ? "Memuat naik…" : "Muat naik & kemas kini"}
        </button>
        {error ? <p className="mt-2 text-sm text-bloom-deep">{error}</p> : null}
        {done ? <p className="mt-2 text-sm text-ink">{done}</p> : null}
      </div>
    </form>
  );
}
