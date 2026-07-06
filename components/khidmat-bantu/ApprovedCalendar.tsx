"use client";

import { useMemo, useState } from "react";
import KhidmatRequestCard from "./KhidmatRequestCard";
import {
  buildMonthGrid,
  getServiceTitle,
  indexByServiceDate,
  monthLabelOf,
} from "@/lib/khidmat-bantu/date-group";
import { formatDayName, formatMalayDate, fromIsoDate, toIsoDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";

const DAY_HEADERS = ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"];

/**
 * Kalendar khidmat bantu diluluskan berdasarkan tarikh aktiviti.
 * Desktop (sm+): grid bulanan; telefon: aliran agenda bertindan.
 */
export default function ApprovedCalendar({ rows }: { rows: KhidmatBantuRow[] }) {
  const now = new Date();
  const todayIso = toIsoDate(now);
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => indexByServiceDate(rows), [rows]);
  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);

  const agenda = useMemo(
    () =>
      [...byDate.entries()]
        .filter(([date]) => {
          const d = fromIsoDate(date);
          return d.getFullYear() === cursor.year && d.getMonth() === cursor.month;
        })
        .sort((a, b) => a[0].localeCompare(b[0])),
    [byDate, cursor],
  );

  function shift(delta: number) {
    setSelected(null);
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const selectedRows = selected ? byDate.get(selected) ?? [] : [];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="btn-outline-ink btn-sm"
          aria-label="Bulan sebelumnya"
        >
          ‹
        </button>
        <p className="font-semibold">{monthLabelOf(cursor.year, cursor.month)}</p>
        <button
          type="button"
          onClick={() => shift(1)}
          className="btn-outline-ink btn-sm"
          aria-label="Bulan seterusnya"
        >
          ›
        </button>
      </div>

      <div className="mt-4 hidden sm:block">
        <div className="grid grid-cols-7 gap-1">
          {DAY_HEADERS.map((h) => (
            <div key={h} className="pb-1 text-center text-[11px] text-graphite">
              {h}
            </div>
          ))}
          {weeks.flat().map((date, i) => {
            if (!date) {
              return <div key={i} className="min-h-[76px] rounded-lg bg-cloud/30" />;
            }
            const dayRows = byDate.get(date) ?? [];
            const dayNum = Number(date.slice(8));
            const isToday = date === todayIso;
            const isSelected = date === selected;
            const hasRows = dayRows.length > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => (hasRows ? setSelected(isSelected ? null : date) : undefined)}
                className={cn(
                  "min-h-[76px] rounded-lg border p-1.5 text-left align-top transition",
                  isSelected
                    ? "border-primary bg-primary-soft/20"
                    : isToday
                      ? "border-primary/60"
                      : "border-fog hairline",
                  hasRows ? "cursor-pointer hover:border-steel" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "text-[11px]",
                    isToday ? "font-semibold text-primary" : "text-graphite",
                  )}
                >
                  {dayNum}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayRows.slice(0, 2).map((row) => (
                    <p
                      key={row.id}
                      title={getServiceTitle(row)}
                      className="truncate rounded bg-primary-soft/25 px-1 py-0.5 text-[10px] leading-tight text-primary-deep"
                    >
                      {getServiceTitle(row)}
                    </p>
                  ))}
                  {dayRows.length > 2 && (
                    <p className="px-1 text-[10px] text-graphite">+{dayRows.length - 2} lagi</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">
              {formatDayName(selected)}, {formatMalayDate(selected)}
            </p>
            <div className="space-y-2">
              {selectedRows.map((row) => (
                <KhidmatRequestCard key={row.id} row={row} bare showDate={false} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4 sm:hidden">
        {agenda.length === 0 ? (
          <div className="card p-8 text-center text-sm text-graphite">
            Tiada khidmat bantu diluluskan bulan ini.
          </div>
        ) : (
          agenda.map(([date, dayRows]) => (
            <div key={date}>
              <p className="mb-1.5 text-xs font-medium text-graphite">
                {formatMalayDate(date, { year: undefined })} · {formatDayName(date)}
              </p>
              <div className="space-y-2">
                {dayRows.map((row) => (
                  <KhidmatRequestCard key={row.id} row={row} bare showDate={false} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
