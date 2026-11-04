"use client";

import { useMemo, useState } from "react";
import type { DirektoriPpdItem } from "@/lib/direktori-ppd/queries";

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const telHref = (v: string) => `tel:${v.replace(/[^\d+]/g, "")}`;

export default function DirektoriPpdList({ rows }: { rows: DirektoriPpdItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return rows;
    const digits = query.replace(/\D/g, "");
    return rows.filter((r) => {
      if (norm(`${r.nama} ${r.gred} ${r.jawatan}`).includes(q)) return true;
      return digits.length >= 3 && r.telefon.replace(/\D/g, "").includes(digits);
    });
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="carian-direktori-ppd" className="label">Cari pegawai</label>
        <input
          id="carian-direktori-ppd"
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nama, jawatan, gred atau no. telefon"
          autoComplete="off"
        />
      </div>
      <p className="text-sm text-graphite" aria-live="polite">
        {filtered.length} daripada {rows.length} pegawai
      </p>
      {filtered.length === 0 ? (
        <div className="card p-6 text-sm text-graphite">Tiada pegawai sepadan.</div>
      ) : (
        <ul className="card divide-y divide-fog">
          {filtered.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{r.nama}</p>
                <p className="mt-0.5 text-sm text-graphite">{r.jawatan || "—"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                {r.gred && <span className="status-badge">{r.gred}</span>}
                {r.telefon ? (
                  <a href={telHref(r.telefon)} className="link-blue tabular-nums">{r.telefon}</a>
                ) : (
                  <span className="text-graphite">—</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
