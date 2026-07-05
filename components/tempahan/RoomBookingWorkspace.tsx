"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatSlot, type BookingLike, type Slot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";
import BookingForm from "./BookingForm";
import CalendarBoard from "./CalendarBoard";

type ViewRange = "week" | "month";

const formProps = {
  desktopId: "tempah",
  mobileId: "tempah-sheet",
} as const;

function visibleDates(dates: string[], today: string, view: ViewRange): string[] {
  if (view === "month") return dates;
  const upcoming = dates.filter((d) => d >= today);
  const pool = upcoming.length > 0 ? upcoming : dates;
  return pool.slice(0, 7);
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
}

export default function RoomBookingWorkspace({
  pkgId,
  roomSlug,
  roomName,
  bookings,
  dates,
  today,
  detailBase,
  previousStart,
  nextStart,
  monthStart,
  monthLabel,
}: {
  pkgId: string;
  roomSlug: string;
  roomName: string;
  bookings: BookingLike[];
  dates: string[];
  today: string;
  detailBase: string;
  previousStart: string;
  nextStart: string;
  monthStart: string;
  monthLabel: string;
}) {
  const [view, setView] = useState<ViewRange>("week");
  const [prefill, setPrefill] = useState<{ date: string; slot: Slot } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const displayDates = useMemo(
    () => visibleDates(dates, today, view),
    [dates, today, view],
  );

  const prefillLabel = prefill
    ? `${formatMalayDate(prefill.date)} · ${formatSlot(prefill.slot)}`
    : undefined;

  const sharedFormProps = {
    pkgId,
    defaultRoomSlug: roomSlug,
    rooms: [{ slug: roomSlug, name: roomName }],
    bookings,
    prefillDate: prefill?.date,
    prefillSlot: prefill?.slot,
    prefillLabel,
  };

  function openSheet(next?: { date: string; slot: Slot }) {
    if (next) setPrefill(next);
    setSheetOpen(true);
  }

  function onSlotSelect(date: string, slot: Slot) {
    setPrefill({ date, slot });
    if (isMobileViewport()) {
      setSheetOpen(true);
    }
  }

  useEffect(() => {
    if (!sheetOpen || !isMobileViewport()) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSheetOpen(false);
    }
    if (sheetOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetOpen]);

  const calendarSection = (
    <section className="card p-4 lg:p-6" id="jadual">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Status tempahan
          </p>
          <h2 className="mt-0.5 text-lg font-semibold lg:text-xl">Jadual Bilik</h2>
          <p className="mt-0.5 text-xs text-graphite lg:text-sm">
            {view === "week" && displayDates.length > 0
              ? `${formatMalayDate(displayDates[0])} – ${formatMalayDate(displayDates[displayDates.length - 1])}`
              : dates.length > 0
                ? `${formatMalayDate(dates[0])} – ${formatMalayDate(dates[dates.length - 1])}`
                : "—"}
          </p>
        </div>

        <div
          className="flex items-center gap-2 text-[10px] text-graphite lg:text-xs"
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
            onClick={() => setView("week")}
          >
            7 hari
          </button>
          <button
            type="button"
            className={cn(
              "rounded px-2.5 py-1 font-semibold transition",
              view === "month" ? "bg-primary text-white" : "text-graphite hover:text-ink",
            )}
            onClick={() => setView("month")}
          >
            Bulan
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href={`${detailBase}?start=${previousStart}`}
            scroll={false}
            className="btn-outline-ink btn-sm !h-8 !px-2.5 !text-[10px]"
            aria-label="Bulan sebelum"
          >
            ‹
          </Link>
          <span className="min-w-[72px] text-center text-xs font-semibold tabular-nums">{monthLabel}</span>
          <Link
            href={`${detailBase}?start=${nextStart}`}
            scroll={false}
            className="btn-outline-ink btn-sm !h-8 !px-2.5 !text-[10px]"
            aria-label="Bulan seterusnya"
          >
            ›
          </Link>
          <Link
            href={`${detailBase}?start=${monthStart}`}
            scroll={false}
            className="btn-outline-ink btn-sm !h-8 !px-2.5 !text-[10px] lg:!text-xs"
          >
            Hari ini
          </Link>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-graphite lg:hidden">
        Ketuk slot <strong className="text-primary-deep">Kosong</strong> untuk tempah.
      </p>
      <p className="mt-2 hidden text-xs text-graphite lg:block">
        Klik slot <strong className="text-primary-deep">Kosong</strong> untuk isi borang di sebelah kanan.
      </p>

      <div className="mt-4">
        <CalendarBoard
          roomSlug={roomSlug}
          bookings={bookings}
          dates={displayDates}
          onSlotSelect={onSlotSelect}
        />
      </div>
    </section>
  );

  return (
    <>
      <div className="mt-6 grid items-start gap-5 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,384px)]">
        {calendarSection}

        {/* Desktop: sticky form */}
        <div className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <BookingForm {...sharedFormProps} variant="embedded" formId={formProps.desktopId} />
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <BookingForm
        {...sharedFormProps}
        variant="sheet"
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        formId={formProps.mobileId}
      />

      {/* Mobile: FAB */}
      <button
        type="button"
        onClick={() => openSheet()}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-sm font-bold uppercase tracking-wide text-white shadow-modal transition hover:bg-primary-bright active:scale-95 lg:hidden"
        aria-label="Tempah bilik"
      >
        Tempah
      </button>
    </>
  );
}
