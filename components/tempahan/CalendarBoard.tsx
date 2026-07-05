"use client";

import {
  getSlotBooking,
  isSlotAvailable,
  type BookingLike,
  type Slot,
} from "@/lib/tempahan/booking-rules";
import { formatDayName, formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";

const toneStyles = {
  available: {
    cell: "border-l-primary bg-primary-soft/15 hover:bg-primary-soft/30",
    label: "text-primary-deep",
  },
  pending: {
    cell: "border-l-amber-400 bg-amber-50",
    label: "text-amber-900",
  },
  booked: {
    cell: "border-l-steel bg-cloud",
    label: "text-graphite",
  },
};

function SlotCell({
  slot,
  booking,
  onSelect,
}: {
  slot: "am" | "pm";
  booking: BookingLike | undefined;
  onSelect?: (slot: Slot) => void;
}) {
  const isFullDay = booking?.slot === "full_day";
  const tone = booking ? (booking.status === "pending" ? "pending" : "booked") : "available";
  const styles = toneStyles[tone];
  const slotLabel = slot === "am" ? "Pagi" : "Petang";
  const statusShort = booking?.status === "pending" ? "Menunggu" : "Diluluskan";
  const isClickable = tone === "available" && onSelect;

  const content = booking ? (
    <>
      <p className="line-clamp-2 text-xs font-medium leading-snug" title={booking.purpose}>
        {booking.purpose}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[10px] opacity-80">
        {booking.name} · {statusShort}
      </p>
      {isFullDay && (
        <span className="mt-0.5 inline-block text-[10px] font-semibold opacity-70">Penuh hari</span>
      )}
    </>
  ) : (
    <span className={cn("text-xs font-semibold", styles.label)}>Kosong</span>
  );

  const className = cn(
    "min-h-[52px] rounded-md border border-fog/80 border-l-[3px] px-2 py-1.5 text-left transition xl:min-h-[56px] xl:px-2.5 xl:py-2",
    styles.cell,
    isClickable && "cursor-pointer active:scale-[0.98]",
  );

  if (isClickable) {
    return (
      <button type="button" className={className} onClick={() => onSelect(slot)}>
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">{slotLabel}</span>
        <div className="mt-0.5">{content}</div>
      </button>
    );
  }

  return (
    <div className={className}>
      <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">{slotLabel}</span>
      <div className="mt-0.5">{content}</div>
    </div>
  );
}

export default function CalendarBoard({
  roomSlug,
  bookings,
  dates,
  onSlotSelect,
}: {
  roomSlug: string;
  bookings: BookingLike[];
  dates: string[];
  onSlotSelect?: (date: string, slot: Slot) => void;
}) {
  return (
    <div className="w-full overflow-x-hidden">
      {/* Wide desktop table header (xl+ only) */}
      <div className="mb-2 hidden grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b hairline pb-2 text-xs font-semibold uppercase tracking-wide text-graphite xl:grid">
        <div>Tarikh</div>
        <div className="text-center">Pagi</div>
        <div className="text-center">Petang</div>
      </div>

      <div className="space-y-2 xl:space-y-0">
        {dates.map((date) => {
          const handleSelect = onSlotSelect
            ? (slot: Slot) => onSlotSelect(date, slot)
            : undefined;
          const canBookFullDay =
            Boolean(handleSelect) &&
            isSlotAvailable(bookings, roomSlug, date, "full_day");

          return (
            <div
              key={date}
              className={cn(
                "overflow-hidden rounded-lg border hairline",
                "xl:grid xl:grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] xl:gap-2 xl:rounded-none xl:border-0 xl:border-b xl:py-2 xl:last:border-0",
              )}
            >
              <div className="border-b hairline bg-cloud/60 px-3 py-2 xl:block xl:border-0 xl:bg-transparent xl:px-0 xl:py-2">
                <div className="flex items-baseline gap-2">
                  <strong className="text-sm">{formatDayName(date)}</strong>
                  <span className="text-xs text-graphite tabular-nums">
                    {formatMalayDate(date, { year: undefined })}
                  </span>
                </div>
                {canBookFullDay && (
                  <button
                    type="button"
                    className={cn(
                      "mt-2 flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-primary/35 bg-white px-3 py-2 text-xs font-semibold text-primary-deep shadow-sm transition",
                      "hover:border-primary/50 hover:bg-primary-soft/25 active:scale-[0.98]",
                      "xl:mt-1 xl:inline-flex xl:w-auto xl:border-0 xl:bg-transparent xl:p-0 xl:text-[11px] xl:text-primary xl:shadow-none xl:hover:bg-transparent xl:hover:underline",
                    )}
                    onClick={() => handleSelect!("full_day")}
                  >
                    <svg
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 opacity-80 xl:hidden"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <rect height="18" rx="2" width="18" x="3" y="4" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    Tempah penuh hari
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-2 xl:contents">
                {(["am", "pm"] as const).map((slot) => (
                  <SlotCell
                    key={slot}
                    slot={slot}
                    booking={getSlotBooking(bookings, roomSlug, date, slot)}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
