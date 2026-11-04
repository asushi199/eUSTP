"use client";

import type { OptikPenggunaanPayload } from "@/lib/actions/optik-public";

/** Kedalaman penggunaan guru (hari aktif) + papan guru paling aktif. Nama sahaja — tiada e-mel. */
export default function OptikPenggunaan({ data }: { data: OptikPenggunaanPayload }) {
  const maks = Math.max(1, ...data.kedalaman.map((r) => r.bil));
  const jumlah = data.kedalaman.reduce((n, r) => n + r.bil, 0);
  return (
    <div className="mt-4 space-y-8">
      <section>
        <h4 className="text-base font-semibold tracking-tight">Kedalaman penggunaan guru</h4>
        <p className="mt-1 text-sm text-graphite">
          {jumlah.toLocaleString("ms-MY")} guru pernah guna AI Tools · {data.snapshotLabel}.
          {data.median != null ? ` Median ${data.median} hari aktif.` : ""}
        </p>
        <div className="card mt-3 divide-y divide-fog">
          {data.kedalaman.map((row) => (
            <div key={row.label} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="tabular-nums text-graphite">
                  {row.bil.toLocaleString("ms-MY")} guru · {row.pct.toLocaleString("ms-MY")}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-fog">
                <div
                  className="h-2 rounded-full bg-ink"
                  style={{ width: `${Math.max(2, (100 * row.bil) / maks)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-base font-semibold tracking-tight">Guru paling aktif</h4>
        <p className="mt-1 text-sm text-graphite">
          Sepuluh guru dengan hari aktif tertinggi menggunakan AI Tools (1 Jan hingga tarikh data).
        </p>
        <ol className="card mt-3 divide-y divide-fog">
          {data.teratas.map((row, i) => (
            <li key={`${row.schoolCode}-${row.name}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-steel">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{row.name}</p>
                <p className="mt-0.5 text-xs text-graphite">{row.schoolName}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{row.hariAktif} hari</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
