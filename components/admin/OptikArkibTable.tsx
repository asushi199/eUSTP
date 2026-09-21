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
import { useTransition } from "react";

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
  if (snapshots.length === 0) {
    return <p className="mt-3 text-sm text-graphite">Belum ada arkib. Muat naik CSV pertama di atas.</p>;
  }
  return (
    <div className="card mt-3 divide-y divide-fog">
      {snapshots.map((snap) => (
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
  );
}
