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

      {/* Mudah alih: senarai kad — tiada skrol mendatar */}
      <ul className="space-y-3 md:hidden">
        {filtered.length === 0 && (
          <li className="card p-6 text-center text-sm text-graphite">
            Tiada rekod dijumpai.
          </li>
        )}
        {filtered.map((r) => (
          <li key={`${r.schoolCode}-${r.role}`} className="card p-4">
            <p className="font-medium leading-snug">{r.schoolName}</p>
            <p className="mt-1 text-xs text-graphite">
              {r.schoolCode}
              {r.zone ? ` · ${r.zone}` : ""}
              {r.website ? (
                <>
                  {" · "}
                  <a
                    href={r.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-blue"
                  >
                    Laman web
                  </a>
                </>
              ) : null}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-fog pt-3">
              <p className="min-w-0 flex-1 text-sm leading-snug">
                {r.teacherName || <span className="text-graphite">Tiada nama guru</span>}
              </p>
              {r.phone ? (
                <a
                  href={`tel:${r.phone}`}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-primary/25 px-3 text-sm font-medium tabular-nums text-primary active:bg-primary/5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                  {r.phone}
                </a>
              ) : (
                <span className="shrink-0 text-sm text-graphite">-</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: jadual penuh */}
      <div className="card hidden overflow-x-auto md:block">
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
                  <p className="text-xs text-graphite">
                    {r.schoolCode}
                    {r.website ? (
                      <>
                        {" · "}
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-blue"
                        >
                          Laman web
                        </a>
                      </>
                    ) : null}
                  </p>
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
