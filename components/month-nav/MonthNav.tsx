"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  formatBulan,
  monthLabelOf,
  parseBulan,
  shiftMonth,
} from "@/lib/month-view";
import { currentLetterMonthKey } from "@/lib/resources/search";

const MONTH_SHORTS = Array.from({ length: 12 }, (_, m) =>
  new Date(2000, m, 1).toLocaleDateString("ms-MY", { month: "short" }),
);

const MIN_YEAR = 2000;
const MAX_YEAR = 2099;

function clampParts(year: number, month: number): { year: number; month: number } {
  if (year < MIN_YEAR) return { year: MIN_YEAR, month: 0 };
  if (year > MAX_YEAR) return { year: MAX_YEAR, month: 11 };
  return { year, month };
}

function shiftKey(value: string, delta: number): string {
  const parsed = parseBulan(value);
  if (!parsed) return value;
  const shifted = shiftMonth(parsed.year, parsed.month, delta);
  const clamped = clampParts(shifted.year, shifted.month);
  return formatBulan(clamped.year, clamped.month);
}

function monthPath(path: string, month: string) {
  return `${path}?month=${encodeURIComponent(month)}&page=1`;
}

export default function MonthNav({
  value,
  onChange,
  path,
  allowAll = false,
  showToday = false,
  markedMonths,
  grain = "month",
  className,
}: {
  /** `YYYY-MM` (bulan) atau `YYYY` (tahun), atau `""` untuk semua. */
  value: string;
  onChange?: (month: string) => void;
  /** Laluan pelayan (boleh diserialkan). Anak panah dan pilihan bulan menavigasi serta-merta. */
  path?: string;
  allowAll?: boolean;
  showToday?: boolean;
  markedMonths?: readonly string[];
  grain?: "month" | "year";
  className?: string;
}) {
  const router = useRouter();
  const isYear = grain === "year";
  const yearValue = /^(\d{4})/.exec(value)?.[1] ?? "";
  const parsed = isYear ? null : parseBulan(value);
  const yearNum = yearValue ? Number(yearValue) : NaN;
  const canStep = isYear ? Number.isFinite(yearNum) : Boolean(parsed);
  const prevKey = isYear
    ? String(Math.max(MIN_YEAR, yearNum - 1))
    : parsed
      ? shiftKey(value, -1)
      : value;
  const nextKey = isYear
    ? String(Math.min(MAX_YEAR, yearNum + 1))
    : parsed
      ? shiftKey(value, 1)
      : value;
  const todayKey = isYear ? currentLetterMonthKey().slice(0, 4) : currentLetterMonthKey();

  function go(next: string) {
    if (next === value) return;
    onChange?.(next);
    if (path) router.push(monthPath(path, next));
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <StepControl
          href={path && canStep ? monthPath(path, prevKey) : undefined}
          disabled={!canStep || prevKey === value}
          onClick={() => go(prevKey)}
          label={isYear ? "Tahun sebelumnya" : "Bulan sebelumnya"}
        >
          ‹
        </StepControl>
        {isYear ? (
          <YearPicker
            value={value}
            allowAll={allowAll}
            markedYears={markedMonths}
            onPick={go}
          />
        ) : (
          <MonthPicker
            value={value}
            allowAll={allowAll}
            markedMonths={markedMonths}
            onPick={go}
          />
        )}
        <StepControl
          href={path && canStep ? monthPath(path, nextKey) : undefined}
          disabled={!canStep || nextKey === value}
          onClick={() => go(nextKey)}
          label={isYear ? "Tahun seterusnya" : "Bulan seterusnya"}
        >
          ›
        </StepControl>
      </div>
      {showToday && value !== todayKey ? (
        path ? (
          <Link href={monthPath(path, todayKey)} className="btn-outline-ink btn-sm">
            {isYear ? "Tahun Ini" : "Bulan Ini"}
          </Link>
        ) : (
          <button type="button" className="btn-outline-ink btn-sm" onClick={() => go(todayKey)}>
            {isYear ? "Tahun Ini" : "Bulan Ini"}
          </button>
        )
      ) : null}
    </div>
  );
}

function StepControl({
  href,
  disabled,
  onClick,
  label,
  children,
}: {
  href?: string;
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: string;
}) {
  const className = "btn-outline-ink btn-sm";
  if (href && !disabled) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function MonthPicker({
  value,
  allowAll,
  markedMonths,
  onPick,
}: {
  value: string;
  allowAll: boolean;
  markedMonths?: readonly string[];
  onPick: (month: string) => void;
}) {
  const parsed = parseBulan(value);
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(parsed?.year ?? Number(currentLetterMonthKey().slice(0, 4)));
  const ref = useRef<HTMLDivElement>(null);
  const marked = new Set(markedMonths ?? []);

  useEffect(() => {
    if (open) setPickerYear(parsed?.year ?? Number(currentLetterMonthKey().slice(0, 4)));
  }, [open, parsed?.year]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = parsed ? monthLabelOf(parsed.year, parsed.month) : "Semua bulan";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-[10.5rem] items-center justify-center gap-1 rounded-md px-2 py-1.5 font-semibold hover:bg-cloud/60"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Pilih bulan"
      >
        {label}
        <svg
          aria-hidden
          className={cn("h-4 w-4 text-graphite transition", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pilih bulan"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-fog bg-white p-3 shadow-modal"
        >
          {allowAll ? (
            <button
              type="button"
              onClick={() => {
                onPick("");
                setOpen(false);
              }}
              className={cn(
                "mb-2 w-full rounded-md px-2 py-1.5 text-sm font-medium transition",
                !parsed ? "bg-ink text-white" : "text-ink hover:bg-cloud/70",
              )}
            >
              Semua bulan
            </button>
          ) : null}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPickerYear((y) => Math.max(MIN_YEAR, y - 1))}
              className="btn-outline-ink btn-sm"
              aria-label="Tahun sebelumnya"
              disabled={pickerYear <= MIN_YEAR}
            >
              ‹
            </button>
            <span className="font-semibold tabular-nums">{pickerYear}</span>
            <button
              type="button"
              onClick={() => setPickerYear((y) => Math.min(MAX_YEAR, y + 1))}
              className="btn-outline-ink btn-sm"
              aria-label="Tahun seterusnya"
              disabled={pickerYear >= MAX_YEAR}
            >
              ›
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {MONTH_SHORTS.map((monthLabel, m) => {
              const key = formatBulan(pickerYear, m);
              const active = parsed?.year === pickerYear && parsed.month === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onPick(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm font-medium transition",
                    active ? "bg-primary text-white" : "text-ink hover:bg-cloud/70",
                  )}
                >
                  <span className="block">{monthLabel}</span>
                  {marked.has(key) ? (
                    <span
                      className={cn(
                        "mx-auto mt-1 block h-1 w-1 rounded-full",
                        active ? "bg-white" : "bg-primary",
                      )}
                      aria-hidden
                    />
                  ) : (
                    <span className="mt-1 block h-1" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function YearPicker({
  value,
  allowAll,
  markedYears,
  onPick,
}: {
  value: string;
  allowAll: boolean;
  markedYears?: readonly string[];
  onPick: (year: string) => void;
}) {
  const selected = /^(\d{4})/.exec(value)?.[1] ?? "";
  const selectedYear = selected ? Number(selected) : Number(currentLetterMonthKey().slice(0, 4));
  const [open, setOpen] = useState(false);
  const [windowStart, setWindowStart] = useState(selectedYear - 4);
  const ref = useRef<HTMLDivElement>(null);
  const marked = new Set(
    (markedYears ?? []).map((key) => /^(\d{4})/.exec(key)?.[1] ?? key).filter(Boolean),
  );

  useEffect(() => {
    if (open) setWindowStart(Math.max(MIN_YEAR, selectedYear - 4));
  }, [open, selectedYear]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const years = Array.from({ length: 9 }, (_, i) => windowStart + i).filter(
    (year) => year >= MIN_YEAR && year <= MAX_YEAR,
  );
  const label = selected || "Semua tahun";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-[10.5rem] items-center justify-center gap-1 rounded-md px-2 py-1.5 font-semibold hover:bg-cloud/60"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Pilih tahun"
      >
        {label}
        <svg
          aria-hidden
          className={cn("h-4 w-4 text-graphite transition", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pilih tahun"
          className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-fog bg-white p-3 shadow-modal"
        >
          {allowAll ? (
            <button
              type="button"
              onClick={() => {
                onPick("");
                setOpen(false);
              }}
              className={cn(
                "mb-2 w-full rounded-md px-2 py-1.5 text-sm font-medium transition",
                !selected ? "bg-ink text-white" : "text-ink hover:bg-cloud/70",
              )}
            >
              Semua tahun
            </button>
          ) : null}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setWindowStart((y) => Math.max(MIN_YEAR, y - 9))}
              className="btn-outline-ink btn-sm"
              aria-label="Julat tahun sebelumnya"
              disabled={windowStart <= MIN_YEAR}
            >
              ‹
            </button>
            <span className="font-semibold tabular-nums">
              {years[0]}–{years[years.length - 1]}
            </span>
            <button
              type="button"
              onClick={() => setWindowStart((y) => Math.min(MAX_YEAR - 8, y + 9))}
              className="btn-outline-ink btn-sm"
              aria-label="Julat tahun seterusnya"
              disabled={windowStart + 8 >= MAX_YEAR}
            >
              ›
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {years.map((year) => {
              const key = String(year);
              const active = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onPick(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm font-medium transition",
                    active ? "bg-primary text-white" : "text-ink hover:bg-cloud/70",
                  )}
                >
                  <span className="block tabular-nums">{key}</span>
                  {marked.has(key) ? (
                    <span
                      className={cn(
                        "mx-auto mt-1 block h-1 w-1 rounded-full",
                        active ? "bg-white" : "bg-primary",
                      )}
                      aria-hidden
                    />
                  ) : (
                    <span className="mt-1 block h-1" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
