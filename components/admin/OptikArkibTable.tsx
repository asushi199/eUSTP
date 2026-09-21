"use client";

import ActionForm from "@/components/admin/ActionForm";
import DeleteButton from "@/components/admin/DeleteButton";
import {
  deleteOptikSnapshot,
  restoreOptikSnapshot,
  updateOptikSnapshotMeta,
} from "@/lib/actions/analisis-optik";
import type { OptikSnapshotSummary } from "@/lib/analisis/optik-types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

function snapshotYear(capturedOn: string): number {
  const year = Number(String(capturedOn).slice(0, 4));
  return Number.isFinite(year) && year >= 2000 ? year : 0;
}

function formatPct(n: number): string {
  return `${n.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}%`;
}

function RestoreButton({ id, label }: { id: number; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm font-medium text-ink underline-offset-2 hover:underline disabled:opacity-50"
      onClick={() => {
        if (!window.confirm(`Jadikan "${label}" paparan semasa?`)) return;
        startTransition(async () => {
          await restoreOptikSnapshot(id);
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Jadikan semasa"}
    </button>
  );
}

export default function OptikArkibTable({ snapshots }: { snapshots: OptikSnapshotSummary[] }) {
  const years = useMemo(() => {
    const counts = new Map<number, number>();
    for (const snap of snapshots) {
      const year = snapshotYear(snap.capturedOn);
      if (!year) continue;
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[0] - a[0]);
  }, [snapshots]);
  const latestYear = years[0]?.[0];
  const [yearFilter, setYearFilter] = useState(latestYear ? String(latestYear) : "all");

  useEffect(() => {
    if (yearFilter === "all") return;
    if (years.some(([year]) => String(year) === yearFilter)) return;
    setYearFilter(latestYear ? String(latestYear) : "all");
  }, [latestYear, yearFilter, years]);

  const filtered =
    yearFilter === "all"
      ? snapshots
      : snapshots.filter((snap) => String(snapshotYear(snap.capturedOn)) === yearFilter);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Arkib</h2>
          <p className="mt-1 text-sm text-graphite">
            Muat turun CSV, pulihkan paparan lama, atau buang titik daripada carta.
          </p>
        </div>
        {years.length > 0 ? (
          <div>
            <label className="label" htmlFor="optik-arkib-tahun">
              Tahun
            </label>
            <select
              id="optik-arkib-tahun"
              className="input w-[9.5rem]"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              {years.map(([year, count]) => (
                <option key={year} value={year}>
                  {year} ({count})
                </option>
              ))}
              <option value="all">Semua tahun ({snapshots.length})</option>
            </select>
          </div>
        ) : null}
      </div>
      {snapshots.length === 0 ? (
        <p className="mt-3 text-sm text-graphite">Belum ada arkib. Muat naik CSV pertama di atas.</p>
      ) : filtered.length === 0 ? (
        <p className="mt-3 text-sm text-graphite">Tiada arkib untuk tahun ini.</p>
      ) : (
        <div className="card mt-3 divide-y divide-fog">
          {filtered.map((snap) => (
            <div key={snap.id} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {snap.chartLabel}
                  {snap.isCurrent ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.6px] text-primary">
                      Semasa
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-graphite">
                  {snap.capturedOn} · {formatPct(snap.selesaiPct)} · {snap.selesaiBil}/{snap.totalBil} guru ·{" "}
                  {snap.sekolahSelesai} sekolah selesai
                </p>
              </div>
              <ActionForm
                action={updateOptikSnapshotMeta}
                submitLabel="Simpan"
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="id" value={snap.id} />
                <input name="chartLabel" defaultValue={snap.chartLabel} className="input w-28" />
                <label className="flex items-center gap-1 text-xs text-graphite">
                  <input type="checkbox" name="includeChart" defaultChecked={snap.includeChart} />
                  carta
                </label>
              </ActionForm>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`/admin/analisis/optik/${snap.id}/csv`}
                  className="text-sm font-medium text-ink underline-offset-2 hover:underline"
                >
                  Muat turun
                </a>
                {snap.isCurrent ? null : <RestoreButton id={snap.id} label={snap.chartLabel} />}
                {snap.isCurrent ? null : (
                  <DeleteButton
                    action={deleteOptikSnapshot.bind(null, snap.id)}
                    confirmText={`Padam arkib "${snap.chartLabel}"?`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
