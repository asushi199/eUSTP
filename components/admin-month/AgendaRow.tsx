"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const STATUS_DOT: Record<string, string> = {
  pending: "bg-graphite",
  approved: "bg-primary",
  rejected: "bg-bloom-deep",
  cancelled: "bg-steel",
};

/**
 * Baris agenda ringkas (gaya takwim): klik untuk kembangkan `children`.
 * Diguna oleh senarai mingguan MonthSection dan gilir pending telefon.
 */
export default function AgendaRow({
  date,
  timeLabel,
  title,
  badgeLabel,
  meta,
  status,
  open,
  onOpenChange,
  showDate = true,
  children,
}: {
  date: string;
  timeLabel: string;
  title: string;
  badgeLabel: string;
  meta?: string;
  status: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showDate?: boolean;
  children: ReactNode;
}) {
  const d = new Date(`${date}T00:00:00`);
  const dayNum = d.getDate();
  const monthShort = d.toLocaleDateString("ms-MY", { month: "short" });
  const weekday = d.toLocaleDateString("ms-MY", { weekday: "short" });

  return (
    <article className="relative">
      <div className="flex gap-3">
        {showDate ? (
          <div className="w-11 shrink-0 text-center pt-1">
            <span className="block text-xl font-bold leading-none text-ink">{dayNum}</span>
            <span className="mt-0.5 block text-[11px] font-medium text-graphite">
              {monthShort}
            </span>
            <span className="block text-[10px] text-steel">{weekday}</span>
          </div>
        ) : (
          <div className="w-11 shrink-0" aria-hidden />
        )}

        <div className="min-w-0 flex-1 border-l border-fog pl-3">
          <button
            type="button"
            className="flex w-full min-h-11 items-start gap-2 rounded-md px-1.5 py-2 text-left hover:bg-cloud/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => onOpenChange(!open)}
            aria-expanded={open}
          >
            <span
              className={cn(
                "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white",
                STATUS_DOT[status] ?? "bg-graphite",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-primary">{timeLabel}</span>
              <span className="mt-0.5 block truncate text-sm font-semibold leading-snug text-ink">
                {title}
              </span>
              {meta ? (
                <span className="mt-0.5 block truncate text-xs text-graphite">{meta}</span>
              ) : null}
            </span>
            <span className="mt-0.5 max-w-[7.5rem] shrink-0 truncate rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              {badgeLabel}
            </span>
          </button>

          {open ? <div className="pb-2 pl-1 pr-1 pt-1">{children}</div> : null}
        </div>
      </div>
    </article>
  );
}
