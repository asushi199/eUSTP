"use client";

import { useMemo, useState } from "react";
import type { OptikSchoolPublicRow } from "@/lib/analisis/optik-types";

function formatPct(n: number): string {
  return `${n.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}%`;
}

export default function OptikSchoolTable({ schools }: { schools: OptikSchoolPublicRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "Selesai" | "Belum">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schools.filter((row) => {
      if (status !== "all" && row.plcStatus !== status) return false;
      if (!q) return true;
      return `${row.schoolCode} ${row.schoolName}`.toLowerCase().includes(q);
    });
  }, [query, schools, status]);

  const selesai = schools.filter((row) => row.plcStatus === "Selesai").length;
  const belum = schools.length - selesai;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end">
        <div>
          <label className="label" htmlFor="optik-carian">
            Cari sekolah
          </label>
          <input
            id="optik-carian"
            className="input"
            placeholder="Kod atau nama sekolah"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="optik-status">
            Status PLC
          </label>
          <select
            id="optik-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">Semua ({schools.length})</option>
            <option value="Selesai">Selesai ({selesai})</option>
            <option value="Belum">Belum ({belum})</option>
          </select>
        </div>
      </div>
      <p className="mt-3 text-xs text-graphite">{filtered.length} sekolah dipaparkan</p>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-fog text-[11px] font-semibold uppercase tracking-[0.6px] text-steel">
              <th className="px-4 py-3">Sekolah</th>
              <th className="px-4 py-3 text-right">Selesai</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              <th className="px-4 py-3 text-right">% AI</th>
              <th className="px-4 py-3">PLC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.schoolCode} className="border-b border-fog/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium leading-snug">{row.schoolName}</p>
                  <p className="mt-0.5 text-xs text-graphite">{row.schoolCode}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{row.selesaiBil}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.totalBil}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPct(row.pctAi)}</td>
                <td className="px-4 py-3">
                  <span className="status-badge">
                    <span
                      className={`status-dot ${row.plcStatus === "Selesai" ? "bg-primary" : "bg-graphite"}`}
                    />
                    {row.plcStatus}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-graphite">
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
