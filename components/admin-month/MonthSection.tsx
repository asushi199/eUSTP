"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  buildMonthGrid,
  groupByDay,
  indexByDay,
  monthLabelOf,
} from "@/lib/month-view";
import { formatDayName, formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";

export type MonthItem = {
  id: string;
  /** ISO yyyy-MM-dd */
  date: string;
  status: string;
  /** Label ringkas untuk sel kalendar (mis. tajuk servis atau "Bilik A · Pagi"). */
  chip: string;
  /** Kad penuh untuk paparan senarai / butiran hari. */
  card: ReactNode;
};

type View = "kalendar" | "senarai";

const DAY_HEADERS = ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"];

const STATUS_FILTERS = [
  { id: "diluluskan", label: "Diluluskan", match: (s: string) => s === "approved" },
  { id: "ditolak", label: "Ditolak", match: (s: string) => s === "rejected" },
  { id: "semua", label: "Semua", match: () => true },
] as const;

/**
 * Seksyen admin berskop-bulan: navigasi bulan + suis Kalendar/Senarai +
 * tapis status. Presentasi tulen — induk hantar item bulan aktif (semua status
 * bukan-pending) dan kad yang telah dirender. Kalendar sentiasa papar approved.
 */
export default function MonthSection({
  year,
  month,
  items,
  onPrevMonth,
  onNextMonth,
  initialView = "kalendar",
  syncViewToUrl = false,
}: {
  year: number;
  month: number;
  items: MonthItem[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  initialView?: View;
  syncViewToUrl?: boolean;
}) {
  const [view, setViewState] = useState<View>(initialView);
  const [statusId, setStatusId] = useState<string>("diluluskan");
  const [selected, setSelected] = useState<string | null>(null);

  function setView(next: View) {
    setViewState(next);
    if (!syncViewToUrl) return;
    const p = new URLSearchParams(window.location.search);
    if (next === "kalendar") p.delete("view");
    else p.set("view", next);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }

  const approved = useMemo(() => items.filter((i) => i.status === "approved"), [items]);
  const byDate = useMemo(() => indexByDay(approved, (i) => i.date), [approved]);
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const matcher = STATUS_FILTERS.find((f) => f.id === statusId) ?? STATUS_FILTERS[0];
  const listGroups = useMemo(
    () => groupByDay(items.filter((i) => matcher.match(i.status)), (i) => i.date),
    [items, matcher],
  );

  const selectedItems = selected ? byDate.get(selected) ?? [] : [];

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              onPrevMonth();
            }}
            className="btn-outline-ink btn-sm"
            aria-label="Bulan sebelumnya"
          >
            ‹
          </button>
          <p className="min-w-[9rem] text-center font-semibold">{monthLabelOf(year, month)}</p>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              onNextMonth();
            }}
            className="btn-outline-ink btn-sm"
            aria-label="Bulan seterusnya"
          >
            ›
          </button>
        </div>

        <div className="inline-flex rounded-full border border-fog p-0.5">
          {(["kalendar", "senarai"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition",
                view === v ? "bg-primary text-white" : "text-graphite hover:text-ink",
              )}
            >
              {v === "kalendar" ? "Kalendar" : "Senarai"}
            </button>
          ))}
        </div>
      </div>

      {view === "kalendar" ? (
        <MonthCalendar
          weeks={weeks}
          byDate={byDate}
          selected={selected}
          onSelect={setSelected}
          selectedItems={selectedItems}
        />
      ) : (
        <MonthList
          groups={listGroups}
          statusId={statusId}
          onStatus={setStatusId}
        />
      )}
    </div>
  );
}

function MonthCalendar({
  weeks,
  byDate,
  selected,
  onSelect,
  selectedItems,
}: {
  weeks: (string | null)[][];
  byDate: Map<string, MonthItem[]>;
  selected: string | null;
  onSelect: (date: string | null) => void;
  selectedItems: MonthItem[];
}) {
  const todayIso = new Date().toLocaleDateString("en-CA");
  const agenda = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <>
      <div className="mt-4 hidden sm:block">
        <div className="grid grid-cols-7 gap-1">
          {DAY_HEADERS.map((h) => (
            <div key={h} className="pb-1 text-center text-[11px] text-graphite">
              {h}
            </div>
          ))}
          {weeks.flat().map((date, i) => {
            if (!date) return <div key={i} className="min-h-[76px] rounded-lg bg-cloud/30" />;
            const dayItems = byDate.get(date) ?? [];
            const isToday = date === todayIso;
            const isSelected = date === selected;
            const hasItems = dayItems.length > 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => (hasItems ? onSelect(isSelected ? null : date) : undefined)}
                className={cn(
                  "min-h-[76px] rounded-lg border p-1.5 text-left align-top transition",
                  isSelected
                    ? "border-primary bg-primary-soft/20"
                    : isToday
                      ? "border-primary/60"
                      : "border-fog hairline",
                  hasItems ? "cursor-pointer hover:border-steel" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "text-[11px]",
                    isToday ? "font-semibold text-primary" : "text-graphite",
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayItems.slice(0, 2).map((it) => (
                    <p
                      key={it.id}
                      title={it.chip}
                      className="truncate rounded bg-primary-soft/25 px-1 py-0.5 text-[10px] leading-tight text-primary-deep"
                    >
                      {it.chip}
                    </p>
                  ))}
                  {dayItems.length > 2 && (
                    <p className="px-1 text-[10px] text-graphite">+{dayItems.length - 2} lagi</p>
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
            <div className="space-y-2">{selectedItems.map((it) => it.card)}</div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4 sm:hidden">
        {agenda.length === 0 ? (
          <div className="card p-8 text-center text-sm text-graphite">
            Tiada rekod diluluskan bulan ini.
          </div>
        ) : (
          agenda.map(([date, dayItems]) => (
            <div key={date}>
              <p className="mb-1.5 text-xs font-medium text-graphite">
                {formatMalayDate(date, { year: undefined })} · {formatDayName(date)}
              </p>
              <div className="space-y-2">{dayItems.map((it) => it.card)}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function MonthList({
  groups,
  statusId,
  onStatus,
}: {
  groups: { date: string; items: MonthItem[] }[];
  statusId: string;
  onStatus: (id: string) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onStatus(f.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              statusId === f.id
                ? "border-ink bg-ink text-white"
                : "border-fog text-graphite hover:border-steel",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-sm text-graphite">
          Tiada rekod padanan bulan ini.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div key={g.date}>
              <p className="mb-1.5 text-xs font-medium text-graphite">
                {formatDayName(g.date)}, {formatMalayDate(g.date)}
              </p>
              <div className="space-y-2">{g.items.map((it) => it.card)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
