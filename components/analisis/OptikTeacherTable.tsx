"use client";

import { useMemo, useState } from "react";
import type { OptikTeacherPublicRow } from "@/lib/analisis/optik-types";

export default function OptikTeacherTable({ teachers }: { teachers: OptikTeacherPublicRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "Selesai" | "Belum">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teachers.filter((row) => {
      if (status !== "all" && row.plcStatus !== status) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q);
    });
  }, [query, status, teachers]);

  const selesai = teachers.filter((row) => row.plcStatus === "Selesai").length;
  const belum = teachers.length - selesai;

  if (teachers.length === 0) {
    return (
      <p className="mt-6 text-sm text-graphite">
        Senarai guru belum tersedia untuk sekolah ini.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end">
        <div>
          <label className="label" htmlFor="optik-guru">
            Cari guru
          </label>
          <input
            id="optik-guru"
            className="input"
            placeholder="Nama guru"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="optik-guru-status">
            Status PLC
          </label>
          <select
            id="optik-guru-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">Semua ({teachers.length})</option>
            <option value="Belum">Belum ({belum})</option>
            <option value="Selesai">Selesai ({selesai})</option>
          </select>
        </div>
      </div>
      <p className="mt-3 text-xs text-graphite">{filtered.length} guru dipaparkan</p>
      <div className="card mt-3 divide-y divide-fog">
        {filtered.map((row, index) => (
          <div key={`${row.name}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="min-w-0 font-medium leading-snug">{row.name}</p>
            <span className="status-badge shrink-0">
              <span
                className={`status-dot ${row.plcStatus === "Selesai" ? "bg-primary" : "bg-graphite"}`}
              />
              {row.plcStatus}
            </span>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-graphite">Tiada guru sepadan.</p>
        ) : null}
      </div>
    </div>
  );
}
