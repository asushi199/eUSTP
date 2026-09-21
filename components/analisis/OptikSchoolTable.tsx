"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { OptikSchoolPublicRow } from "@/lib/analisis/optik-types";

function formatPct(n: number): string {
  return `${n.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}%`;
}

function SchoolName({
  row,
  onSelectSchool,
}: {
  row: OptikSchoolPublicRow;
  onSelectSchool?: (row: OptikSchoolPublicRow) => void;
}) {
  const className = "block w-full text-left font-medium leading-snug text-ink hover:underline";
  if (onSelectSchool) {
    return (
      <button type="button" className={className} onClick={() => onSelectSchool(row)}>
        {row.schoolName}
      </button>
    );
  }
  return (
    <Link href={`/analisis/ai-tools/${row.schoolCode}`} className={className}>
      {row.schoolName}
    </Link>
  );
}

function PlcBadge({ status }: { status: string }) {
  return (
    <span className="status-badge shrink-0">
      <span className={`status-dot ${status === "Selesai" ? "bg-primary" : "bg-graphite"}`} />
      {status}
    </span>
  );
}

export default function OptikSchoolTable({
  schools,
  onSelectSchool,
}: {
  schools: OptikSchoolPublicRow[];
  onSelectSchool?: (row: OptikSchoolPublicRow) => void;
}) {
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

      <ul className="mt-3 space-y-3 sm:hidden">
        {filtered.length === 0 ? (
          <li className="card p-6 text-center text-sm text-graphite">Tiada sekolah sepadan.</li>
        ) : (
          filtered.map((row) => (
            <li key={row.schoolCode} className="card p-4">
              <SchoolName row={row} onSelectSchool={onSelectSchool} />
              <p className="mt-0.5 text-xs text-graphite">{row.schoolCode}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-fog pt-3 text-sm">
                <p className="tabular-nums text-graphite">
                  {row.selesaiBil}/{row.totalBil} · {formatPct(row.pctAi)}
                </p>
                <PlcBadge status={row.plcStatus} />
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="card mt-3 hidden overflow-x-auto sm:block">
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
                <td className="min-w-[12rem] px-4 py-3">
                  <SchoolName row={row} onSelectSchool={onSelectSchool} />
                  <p className="mt-0.5 text-xs text-graphite">{row.schoolCode}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{row.selesaiBil}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{row.totalBil}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatPct(row.pctAi)}</td>
                <td className="px-4 py-3">
                  <PlcBadge status={row.plcStatus} />
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
