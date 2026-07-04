"use client";

import { useMemo, useState } from "react";
import type { PublicDirectoryRow } from "@/lib/direktori/queries";

export default function RoleDirectoryTable({ rows }: { rows: PublicDirectoryRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.schoolCode, r.schoolName, r.zone, r.teacherName, r.phone]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, rows]);

  return (
    <div>
      <div className="mb-4 max-w-md">
        <label className="label" htmlFor="carian">
          Cari sekolah / guru
        </label>
        <input
          id="carian"
          className="input"
          placeholder="Kod sekolah, nama sekolah atau nama guru"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="mt-1 text-xs text-graphite">{filtered.length} rekod</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Sekolah</th>
              <th className="px-4 py-3 font-semibold">Zon</th>
              <th className="px-4 py-3 font-semibold">Nama Guru</th>
              <th className="px-4 py-3 font-semibold">Telefon</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-graphite">
                  Tiada rekod dijumpai.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={`${r.schoolCode}-${r.role}`} className="border-b hairline last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.schoolName}</p>
                  <p className="text-xs text-graphite">{r.schoolCode}</p>
                </td>
                <td className="px-4 py-3 text-graphite">{r.zone || "-"}</td>
                <td className="px-4 py-3">{r.teacherName || "-"}</td>
                <td className="px-4 py-3">
                  {r.phone ? (
                    <a href={`tel:${r.phone}`} className="link-blue">
                      {r.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
