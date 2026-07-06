"use client";

import { useMemo, useState } from "react";
import KhidmatRequestCard from "./KhidmatRequestCard";
import { getServiceTitle, groupByServiceDate } from "@/lib/khidmat-bantu/date-group";
import { formatDayName, formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";

const STATUS_FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "approved", label: "Diluluskan" },
  { id: "rejected", label: "Ditolak" },
] as const;

/**
 * Senarai rekod dikumpul Tahun > Bulan > Hari.
 * Tahun semasa dibuka secara lalai; tahun lain terkumpul sehingga diklik.
 */
export default function GroupedRequestList({ rows }: { rows: KhidmatBantuRow[] }) {
  const [status, setStatus] = useState<string>("semua");
  const [query, setQuery] = useState("");
  const now = new Date();
  const currentYear = now.getFullYear();
  const [openYears, setOpenYears] = useState<Set<number>>(() => new Set([currentYear]));
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    () => new Set([`${currentYear}-${now.getMonth()}`]),
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "semua" && row.status !== status) return false;
      if (!needle) return true;
      const hay = `${getServiceTitle(row)} ${row.orgName} ${row.applicantName}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, status, query]);

  const grouped = useMemo(() => groupByServiceDate(filtered), [filtered]);
  const isEmpty = grouped.years.length === 0 && grouped.invalid.length === 0;

  function toggleYear(year: number) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function toggleMonth(key: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatus(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                status === f.id
                  ? "border-ink bg-ink text-white"
                  : "border-fog text-graphite hover:border-steel",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="input sm:ml-auto sm:max-w-xs"
          placeholder="Cari tajuk, sekolah, pemohon"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isEmpty ? (
        <div className="card mt-4 p-8 text-center text-sm text-graphite">
          Tiada rekod padanan.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {grouped.years.map((yg) => {
            const open = openYears.has(yg.year);
            return (
              <div key={yg.year} className="overflow-hidden rounded-xl border border-fog/70 bg-white">
                <button
                  type="button"
                  onClick={() => toggleYear(yg.year)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-cloud/50"
                >
                  <span className="font-semibold">{yg.year}</span>
                  <span className="flex items-center gap-2 text-xs text-graphite">
                    {yg.total} permohonan
                    <svg
                      aria-hidden
                      className={cn("h-4 w-4 transition", open && "rotate-180")}
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                {open && (
                  <div className="space-y-2 border-t hairline px-4 py-4">
                    {yg.months.map((mg) => {
                      const monthKey = `${yg.year}-${mg.month}`;
                      const monthOpen = openMonths.has(monthKey);
                      return (
                        <div key={mg.month} className="rounded-lg border border-fog/60">
                          <button
                            type="button"
                            onClick={() => toggleMonth(monthKey)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-cloud/40"
                          >
                            <span className="text-sm font-semibold">{mg.label}</span>
                            <span className="flex items-center gap-2 text-xs text-graphite">
                              {mg.total}
                              <svg
                                aria-hidden
                                className={cn("h-4 w-4 transition", monthOpen && "rotate-180")}
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </span>
                          </button>
                          {monthOpen && (
                            <div className="space-y-4 border-t hairline px-3 py-3">
                              {mg.days.map((dg) => (
                                <div key={dg.date}>
                                  <p className="mb-1.5 text-xs font-medium text-graphite">
                                    {formatDayName(dg.date)}, {formatMalayDate(dg.date)}
                                  </p>
                                  <div className="space-y-2">
                                    {dg.rows.map((row) => (
                                      <KhidmatRequestCard
                                        key={row.id}
                                        row={row}
                                        bare
                                        showDate={false}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {grouped.invalid.length > 0 && (
            <div className="rounded-xl border border-fog/70 bg-white p-4">
              <p className="text-sm font-semibold text-graphite">Tarikh tidak sah</p>
              <div className="mt-2 space-y-2">
                {grouped.invalid.map((row) => (
                  <KhidmatRequestCard key={row.id} row={row} bare />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
