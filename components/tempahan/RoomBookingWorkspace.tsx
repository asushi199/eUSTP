"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatSlot, type BookingLike, type Slot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";
import BookingForm from "./BookingForm";
import CalendarBoard, { BookingDetailDialog } from "./CalendarBoard";
import RoomCapacityBadge from "./RoomCapacityBadge";

type ViewRange = "week" | "month";

const DESKTOP_MQ = "(min-width: 1280px)";

const formProps = {
  desktopId: "tempah",
  mobileId: "tempah-sheet",
} as const;

/** 7 hari bermula dari focusDate dalam bulan; bulan = semua tarikh. */
function visibleDates(dates: string[], focusDate: string, view: ViewRange): string[] {
  if (view === "month") return dates;
  const startIdx = dates.findIndex((d) => d >= focusDate);
  const idx = startIdx >= 0 ? startIdx : 0;
  return dates.slice(idx, idx + 7);
}

function isCompactLayout() {
  return typeof window !== "undefined" && !window.matchMedia(DESKTOP_MQ).matches;
}

function viewQuery(view: ViewRange) {
  return view === "month" ? "bulan" : "week";
}

/** Klik label → pilih mana-mana tarikh (native date picker). */
function DateJumpControl({
  focusDate,
  monthLabel,
  detailBase,
}: {
  focusDate: string;
  monthLabel: string;
  detailBase: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // fallback
      }
    }
    input.click();
  }

  return (
    <div className="relative inline-flex min-w-[72px] justify-center">
      <button
        type="button"
        onClick={openPicker}
        className="rounded px-1.5 py-1 text-center text-xs font-semibold tabular-nums text-ink hover:bg-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label="Pilih tarikh untuk lompat ke jadual"
        title="Klik untuk pilih tarikh"
      >
        {monthLabel}
      </button>
      <input
        ref={inputRef}
        type="date"
        className="sr-only"
        value={focusDate}
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const next = e.target.value;
          if (!next) return;
          // Kekal paparan 7 hari; fokus bermula dari tarikh dipilih.
          router.push(`${detailBase}?start=${next}&view=week`, { scroll: false });
        }}
      />
    </div>
  );
}

export default function RoomBookingWorkspace({
  pkgId,
  roomSlug,
  roomName,
  roomCapacity,
  bookings,
  dates,
  today,
  focusDate,
  detailBase,
  previousStart,
  nextStart,
  monthStart,
  todayMonthStart,
  monthLabel,
  initialView = "week",
}: {
  pkgId: string;
  roomSlug: string;
  roomName: string;
  roomCapacity: number | null;
  bookings: BookingLike[];
  dates: string[];
  today: string;
  focusDate: string;
  detailBase: string;
  previousStart: string;
  nextStart: string;
  monthStart: string;
  todayMonthStart: string;
  monthLabel: string;
  initialView?: ViewRange;
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewRange>(initialView);
  const [prefill, setPrefill] = useState<{ date: string; slot: Slot } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<BookingLike | null>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView, focusDate]);

  const displayDates = useMemo(
    () => visibleDates(dates, focusDate, view),
    [dates, focusDate, view],
  );

  const isToday = focusDate === today;
  const isCurrentMonth = monthStart === todayMonthStart;

  const prefillLabel = prefill
    ? `${formatMalayDate(prefill.date)} · ${formatSlot(prefill.slot)}`
    : undefined;

  const sharedFormProps = {
    pkgId,
    defaultRoomSlug: roomSlug,
    rooms: [{ slug: roomSlug, name: roomName }],
    bookings,
    roomCapacity,
    prefillDate: prefill?.date,
    prefillSlot: prefill?.slot,
    prefillLabel,
  };

  function setViewAndUrl(next: ViewRange) {
    setView(next);
    router.push(`${detailBase}?start=${focusDate}&view=${viewQuery(next)}`, { scroll: false });
  }

  function openSheet(next?: { date: string; slot: Slot }) {
    if (next) setPrefill(next);
    setSheetOpen(true);
  }

  function onSlotSelect(date: string, slot: Slot) {
    setPrefill({ date, slot });
    if (isCompactLayout()) {
      setSheetOpen(true);
    }
  }

  useEffect(() => {
    if (!sheetOpen || !isCompactLayout()) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (detailBooking) setDetailBooking(null);
      else if (sheetOpen) setSheetOpen(false);
    }
    if (sheetOpen || detailBooking) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetOpen, detailBooking]);

  const calendarSection = (
    <section className="card p-4 xl:p-6" id="jadual">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Status tempahan
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mt-0.5 text-lg font-semibold xl:text-xl">Jadual Bilik</h2>
            <RoomCapacityBadge capacity={roomCapacity} prominent />
          </div>
          <p className="mt-0.5 text-xs text-graphite xl:text-sm">
            {view === "week" && displayDates.length > 0
              ? `${formatMalayDate(displayDates[0])} – ${formatMalayDate(displayDates[displayDates.length - 1])}`
              : dates.length > 0
                ? `${formatMalayDate(dates[0])} – ${formatMalayDate(dates[dates.length - 1])}`
                : "—"}
          </p>
        </div>

        <div
          className="flex items-center gap-2 text-[10px] text-graphite xl:text-xs"
          aria-label="Petunjuk status"
        >
          <span className="inline-flex items-center gap-1" title="Kosong">
            <span className="h-2 w-2 rounded-full bg-primary-soft ring-1 ring-primary/30" />
            K
          </span>
          <span className="inline-flex items-center gap-1" title="Menunggu">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            M
          </span>
          <span className="inline-flex items-center gap-1" title="Diluluskan">
            <span className="h-2 w-2 rounded-full bg-steel" />
            D
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border hairline p-0.5 text-xs">
          <button
            type="button"
            className={cn(
              "rounded px-2.5 py-1 font-semibold transition",
              view === "week" ? "bg-primary text-white" : "text-graphite hover:text-ink",
            )}
            onClick={() => setViewAndUrl("week")}
          >
            7 hari
          </button>
          <button
            type="button"
            className={cn(
              "rounded px-2.5 py-1 font-semibold transition",
              view === "month" ? "bg-primary text-white" : "text-graphite hover:text-ink",
            )}
            onClick={() => setViewAndUrl("month")}
          >
            Bulan
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href={`${detailBase}?start=${previousStart}&view=bulan`}
            scroll={false}
            className="btn-outline-ink btn-sm !h-8 !px-2.5 !text-[10px]"
            aria-label="Bulan sebelum"
          >
            ‹
          </Link>
          <DateJumpControl
            focusDate={focusDate}
            monthLabel={monthLabel}
            detailBase={detailBase}
          />
          <Link
            href={`${detailBase}?start=${nextStart}&view=bulan`}
            scroll={false}
            className="btn-outline-ink btn-sm !h-8 !px-2.5 !text-[10px]"
            aria-label="Bulan seterusnya"
          >
            ›
          </Link>
          {isToday && isCurrentMonth ? (
            <span
              className="btn-outline-ink btn-sm !h-8 cursor-default !px-2.5 !text-[10px] opacity-45 xl:!text-xs"
              aria-current="date"
            >
              Hari ini
            </span>
          ) : (
            <Link
              href={`${detailBase}?start=${today}&view=week`}
              scroll={false}
              className="btn-outline-ink btn-sm !h-8 !px-2.5 !text-[10px] xl:!text-xs"
            >
              Hari ini
            </Link>
          )}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-graphite">
        Ketik slot <strong className="text-primary-deep">Kosong</strong> untuk tempah; ketik slot{" "}
        <strong className="text-graphite">berwarna</strong> untuk lihat butiran. Klik{" "}
        <strong>{monthLabel}</strong> untuk lompat ke tarikh lain.
        {view === "week" ? " Paparan 7 hari dari tarikh fokus." : " Paparan sebulan."}
      </p>

      <div className="mt-4 -mx-1 overflow-hidden sm:mx-0">
        <CalendarBoard
          roomSlug={roomSlug}
          roomName={roomName}
          bookings={bookings}
          dates={displayDates}
          onSlotSelect={onSlotSelect}
          onBookingDetail={setDetailBooking}
        />
      </div>
    </section>
  );

  return (
    <>
      <div className="mt-6 grid items-start gap-5 xl:mt-10 xl:grid-cols-[minmax(0,1fr)_minmax(320px,384px)]">
        {calendarSection}

        <div className="hidden xl:block xl:sticky xl:top-20 xl:self-start">
          <BookingForm {...sharedFormProps} variant="embedded" formId={formProps.desktopId} />
        </div>
      </div>

      <BookingForm
        {...sharedFormProps}
        variant="sheet"
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        formId={formProps.mobileId}
      />

      {detailBooking && (
        <BookingDetailDialog
          booking={detailBooking}
          roomName={roomName}
          onClose={() => setDetailBooking(null)}
        />
      )}

      <button
        type="button"
        onClick={() => openSheet()}
        className="fixed bottom-24 right-4 z-40 flex h-12 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 text-xs font-bold text-white shadow-modal transition hover:bg-primary-bright active:scale-95 xl:hidden"
        aria-label="Tempah bilik"
      >
        <svg
          aria-hidden
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Tempah
      </button>
    </>
  );
}
