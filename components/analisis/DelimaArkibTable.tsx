"use client";

import { useMemo, useState } from "react";
import type { DelimaArkibRow } from "@/lib/analisis/delima-arkib-meta";

type Sort = "kod" | "nama" | "guru" | "murid";

const pct = (n: number) => `${n.toLocaleString("ms-MY", { maximumFractionDigits: 1 })}%`;

/** Senarai penggunaan DELIMa tahun lepas: peratus aktif guru/murid setiap sekolah sahaja. */
export default function DelimaArkibTable({ schools }: { schools: DelimaArkibRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("kod");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = schools.filter((r) => !q || `${r.kod} ${r.nama}`.toLowerCase().includes(q));
    if (sort === "kod") return rows;
    if (sort === "nama") return [...rows].sort((a, b) => a.nama.localeCompare(b.nama, "ms"));
    return [...rows].sort((a, b) => a[sort] - b[sort]);
  }, [query, schools, sort]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
        <div>
          <label className="label" htmlFor="delima-arkib-carian">
            Cari sekolah
          </label>
          <input
            id="delima-arkib-carian"
            className="input"
            placeholder="Kod atau nama sekolah"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="delima-arkib-susun">
            Susun
          </label>
          <select
            id="delima-arkib-susun"
            className="input"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="kod">Kod sekolah</option>
            <option value="nama">Nama</option>
            <option value="guru">% guru (rendah → tinggi)</option>
            <option value="murid">% murid (rendah → tinggi)</option>
          </select>
        </div>
      </div>
      <p className="mt-3 text-xs text-graphite">{filtered.length} sekolah dipaparkan</p>

      <ul className="mt-3 space-y-3 sm:hidden">
        {filtered.length === 0 ? (
          <li className="card p-6 text-center text-sm text-graphite">Tiada sekolah sepadan.</li>
        ) : (
          filtered.map((row) => (
            <li key={row.kod} className="card p-4">
              <p className="font-medium leading-snug text-ink">{row.nama}</p>
              <p className="mt-0.5 text-xs text-graphite">{row.kod}</p>
              <dl className="mt-3 space-y-2 border-t border-fog pt-3 text-sm tabular-nums">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-graphite">Guru aktif</dt>
                  <dd className="font-medium">{pct(row.guru)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-graphite">Murid aktif</dt>
                  <dd className="font-medium">{pct(row.murid)}</dd>
                </div>
              </dl>
            </li>
          ))
        )}
      </ul>

      <div className="card mt-3 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-fog text-[11px] font-semibold uppercase tracking-[0.6px] text-steel">
              <th className="px-4 py-3">Sekolah</th>
              <th className="px-4 py-3 text-right">Guru aktif</th>
              <th className="px-4 py-3 text-right">Murid aktif</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.kod} className="border-b border-fog/60 last:border-0">
                <td className="min-w-[12rem] px-4 py-3">
                  <p className="font-medium leading-snug text-ink">{row.nama}</p>
                  <p className="mt-0.5 text-xs text-graphite">{row.kod}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                  {pct(row.guru)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                  {pct(row.murid)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-graphite">
                  Tiada sekolah sepadan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
