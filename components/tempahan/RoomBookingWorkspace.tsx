"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatSlot, type BookingLike, type Slot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";
import BookingForm from "./BookingForm";
import CalendarBoard from "./CalendarBoard";

type ViewRange = "week" | "month";

function visibleDates(dates: string[], today: string, view: ViewRange): string[] {
  if (view === "month") return dates;
  const upcoming = dates.filter((d) => d >= today);
  const pool = upcoming.length > 0 ? upcoming : dates;
  return pool.slice(0, 7);
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

  const displayDates = useMemo(
    () => visibleDates(dates, today, view),
    [dates, today, view],
  );

  function onSlotSelect(date: string, slot: Slot) {
    setPrefill({ date, slot });
    requestAnimationFrame(() => {
      document.getElementById("tempah")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <section className="card mt-6 p-4 sm:mt-10 sm:p-6" id="jadual">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Status tempahan
            </p>
            <h2 className="mt-0.5 text-lg font-semibold sm:text-xl">Jadual Bilik</h2>
            <p className="mt-0.5 text-xs text-graphite sm:text-sm">
              {view === "week" && displayDates.length > 0
                ? `${formatMalayDate(displayDates[0])} – ${formatMalayDate(displayDates[displayDates.length - 1])}`
                : dates.length > 0
                  ? `${formatMalayDate(dates[0])} – ${formatMalayDate(dates[dates.length - 1])}`
                  : "—"}
            </p>
          </div>

          <div
            className="flex items-center gap-2 text-[10px] text-graphite sm:text-xs"
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

        {/* View toggle + month nav — single row on mobile */}
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
              className="btn-outline-ink btn-sm !h-8 !px-2.5 !text-[10px] sm:!text-xs"
            >
              Hari ini
            </Link>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-graphite sm:text-xs">
          Ketuk slot <strong className="text-primary-deep">Kosong</strong> untuk isi borang tempahan.
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

      <div className="mt-6 sm:mt-8">
        <BookingForm
          pkgId={pkgId}
          defaultRoomSlug={roomSlug}
          rooms={[{ slug: roomSlug, name: roomName }]}
          bookings={bookings}
          prefillDate={prefill?.date}
          prefillSlot={prefill?.slot}
          prefillLabel={
            prefill
              ? `${formatMalayDate(prefill.date)} · ${formatSlot(prefill.slot)}`
              : undefined
          }
        />
      </div>

      {/* Sticky CTA — mobile only, above bottom tab bar */}
      <a
        href="#tempah"
        className="fixed bottom-20 left-4 right-4 z-40 btn-primary !h-11 shadow-modal sm:hidden"
      >
        Tempah bilik ini
      </a>
    </>
  );
}
