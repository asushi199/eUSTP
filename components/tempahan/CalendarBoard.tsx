"use client";

import {
  getSlotBooking,
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
    "min-h-[52px] rounded-md border border-fog/80 border-l-[3px] px-2 py-1.5 text-left transition sm:min-h-[58px] sm:px-3 sm:py-2",
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
    <div className="w-full overflow-x-hidden sm:overflow-x-auto">
      {/* Desktop table header */}
      <div className="mb-2 hidden min-w-[480px] grid-cols-[120px_1fr_1fr] gap-2 border-b hairline pb-2 text-xs font-semibold uppercase tracking-wide text-graphite sm:grid">
        <div>Tarikh</div>
        <div className="text-center">Pagi</div>
        <div className="text-center">Petang</div>
      </div>

      <div className="space-y-2 sm:min-w-[480px] sm:space-y-0">
        {dates.map((date) => {
          const handleSelect = onSlotSelect
            ? (slot: Slot) => onSlotSelect(date, slot)
            : undefined;

          return (
            <div
              key={date}
              className={cn(
                "overflow-hidden rounded-lg border hairline sm:grid sm:grid-cols-[120px_1fr_1fr] sm:gap-2 sm:rounded-none sm:border-0 sm:border-b sm:py-2 sm:last:border-0",
              )}
            >
              {/* Date header — compact bar on mobile, column on desktop */}
              <div className="flex items-center gap-2 border-b hairline bg-cloud/60 px-3 py-2 sm:block sm:border-0 sm:bg-transparent sm:px-0 sm:py-2">
                <strong className="text-sm">{formatDayName(date)}</strong>
                <span className="text-xs text-graphite tabular-nums">
                  {formatMalayDate(date, { year: undefined })}
                </span>
              </div>

              {/* Mobile: Pagi + Petang side by side */}
              <div className="grid grid-cols-2 gap-2 p-2 sm:contents">
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
