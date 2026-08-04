"use client";

import { useEffect, useMemo, useState } from "react";
import AgendaRow from "@/components/admin-month/AgendaRow";
import type { MonthItem } from "@/components/admin-month/types";
import {
  defaultOpenWeekKey,
  groupItemsByWeek,
  weekRangeLabel,
} from "@/lib/month-view";
import { cn } from "@/lib/cn";

const STATUS_FILTERS = [
  { id: "diluluskan", label: "Diluluskan", match: (s: string) => s === "approved" },
  { id: "ditolak", label: "Ditolak", match: (s: string) => s === "rejected" },
  { id: "semua", label: "Semua", match: () => true },
] as const;

/**
 * Senarai tempahan/admin bergrup minggu (gaya takwim). Item mesti ada `agenda`.
 */
export default function WeekAgendaList({
  year,
  month,
  items,
  statusId,
  onStatus,
}: {
  year: number;
  month: number;
  items: MonthItem[];
  statusId: string;
  onStatus: (id: string) => void;
}) {
  const matcher = STATUS_FILTERS.find((f) => f.id === statusId) ?? STATUS_FILTERS[0];
  const filtered = useMemo(
    () => items.filter((i) => matcher.match(i.status) && i.agenda),
    [items, matcher],
  );

  const weeks = useMemo(
    () => groupItemsByWeek(year, month, filtered, (i) => i.date),
    [year, month, filtered],
  );

  const todayIso = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const openKey = useMemo(() => defaultOpenWeekKey(weeks, todayIso), [weeks, todayIso]);

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

      {weeks.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-sm text-graphite">
          Tiada rekod padanan bulan ini.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {weeks.map((week) => (
            <WeekBlock
              key={week.weekKey}
              weekKey={week.weekKey}
              weekNumber={week.weekNumber}
              startDateKey={week.startDateKey}
              endDateKey={week.endDateKey}
              itemCount={week.itemCount}
              days={week.days}
              defaultOpen={week.weekKey === openKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekBlock({
  weekKey,
  weekNumber,
  startDateKey,
  endDateKey,
  itemCount,
  days,
  defaultOpen,
}: {
  weekKey: string;
  weekNumber: number;
  startDateKey: string;
  endDateKey: string;
  itemCount: number;
  days: { date: string; items: MonthItem[] }[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setOpen(defaultOpen);
    setExpandedId(null);
  }, [defaultOpen, weekKey]);

  return (
    <details
      className="overflow-hidden rounded-lg border border-fog bg-white"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-2 border-b border-fog/80 bg-cloud/40 px-3 py-2.5 text-sm [&::-webkit-details-marker]:hidden">
        <span className="font-bold uppercase tracking-wide text-ink">
          Minggu {weekNumber}
        </span>
        <span className="font-semibold text-ink/80">
          {weekRangeLabel(startDateKey, endDateKey)}
        </span>
        <span className="ml-auto inline-flex items-center gap-2 text-xs text-graphite">
          <span className="rounded-full border border-fog bg-white px-2 py-0.5">
            {itemCount} tempahan
          </span>
          <span
            className={cn(
              "text-steel transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          >
            ▾
          </span>
        </span>
      </summary>
      <div className="divide-y divide-fog/70 px-2 py-1 sm:px-3">
        {days.map((day) => (
          <div key={day.date} className="space-y-0.5 py-2">
            {day.items.map((item, idx) => {
              const agenda = item.agenda!;
              const rowOpen = expandedId === item.id;
              return (
                <AgendaRow
                  key={item.id}
                  date={item.date}
                  timeLabel={agenda.timeLabel}
                  title={agenda.title}
                  badgeLabel={agenda.badgeLabel}
                  meta={agenda.meta}
                  status={item.status}
                  open={rowOpen}
                  onOpenChange={(next) => setExpandedId(next ? item.id : null)}
                  showDate={idx === 0}
                >
                  {item.card}
                </AgendaRow>
              );
            })}
          </div>
        ))}
      </div>
    </details>
  );
}
