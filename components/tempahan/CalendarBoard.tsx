"use client";

import {
  formatBookingStatus,
  formatSlot,
  getSlotBooking,
  isSlotAvailable,
  type BookingLike,
  type Slot,
} from "@/lib/tempahan/booking-rules";
import { formatDayName, formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";

const toneStyles = {
  available: {
    cell: "bg-primary-soft/20 text-primary-deep hover:bg-primary-soft/40",
    label: "text-primary-deep",
  },
  pending: {
    cell: "bg-amber-100 text-amber-950 hover:bg-amber-200/80",
    label: "text-amber-900",
  },
  booked: {
    cell: "bg-cloud text-ink hover:bg-fog/70",
    label: "text-graphite",
  },
};

function slotTone(booking: BookingLike | undefined) {
  if (!booking) return "available" as const;
  return booking.status === "pending" ? ("pending" as const) : ("booked" as const);
}

function OccupiedCell({
  booking,
  fullDay,
  onDetail,
}: {
  booking: BookingLike;
  fullDay?: boolean;
  onDetail?: (booking: BookingLike) => void;
}) {
  const tone = slotTone(booking);
  const styles = toneStyles[tone];
  const statusShort = booking.status === "pending" ? "Menunggu" : "Diluluskan";

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded px-2 py-2 text-left text-[10px] leading-tight min-h-[2.5rem] transition-colors cursor-pointer",
        styles.cell,
      )}
      title={`${booking.purpose} — ${booking.name} (${statusShort})`}
      onClick={() => onDetail?.(booking)}
    >
      {fullDay && (
        <div className="font-bold text-[9px] uppercase tracking-wide opacity-70">Penuh hari</div>
      )}
      <div className="font-semibold line-clamp-2">{booking.purpose}</div>
      <div className="truncate opacity-90">{booking.name}</div>
    </button>
  );
}

function EmptyCell({
  onSelect,
  slot,
}: {
  onSelect?: () => void;
  slot: "am" | "pm";
}) {
  const styles = toneStyles.available;
  if (!onSelect) {
    return (
      <div
        className={cn(
          "w-full rounded px-1 py-2 text-center text-[10px] font-semibold min-h-[2.5rem] flex items-center justify-center",
          styles.cell,
        )}
      >
        Kosong
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Tempah slot ${slot === "am" ? "pagi" : "petang"}`}
      className={cn(
        "w-full rounded px-1 py-2 text-center text-[10px] font-semibold min-h-[2.5rem] transition-colors cursor-pointer",
        styles.cell,
      )}
      onClick={onSelect}
    >
      Kosong
    </button>
  );
}

export default function CalendarBoard({
  roomSlug,
  roomName,
  bookings,
  dates,
  onSlotSelect,
  onBookingDetail,
}: {
  roomSlug: string;
  roomName?: string;
  bookings: BookingLike[];
  dates: string[];
  onSlotSelect?: (date: string, slot: Slot) => void;
  onBookingDetail?: (booking: BookingLike) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-fixed text-xs min-w-[20rem]">
        <colgroup>
          <col style={{ width: "4.75rem" }} />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr className="bg-cloud/80">
            <th className="p-2 text-left font-semibold text-graphite">Tarikh</th>
            <th colSpan={2} className="p-2 text-center font-semibold border-l hairline">
              {roomName ?? "Bilik"}
            </th>
          </tr>
          <tr className="bg-cloud/50">
            <th className="p-1" />
            <th className="p-1 font-normal text-graphite border-l hairline">AM</th>
            <th className="p-1 font-normal text-graphite border-l hairline">PM</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const handleSelect = onSlotSelect
              ? (slot: Slot) => onSlotSelect(date, slot)
              : undefined;
            const amBooking = getSlotBooking(bookings, roomSlug, date, "am");
            const pmBooking = getSlotBooking(bookings, roomSlug, date, "pm");
            // Satu rekod full_day: getSlotBooking pulang rekod yang sama untuk am & pm
            const fullDayBooking =
              amBooking?.slot === "full_day"
                ? amBooking
                : pmBooking?.slot === "full_day"
                  ? pmBooking
                  : undefined;

            const canBookFullDay =
              Boolean(handleSelect) &&
              isSlotAvailable(bookings, roomSlug, date, "full_day");

            const dayLabel = `${date.slice(8, 10)}/${date.slice(5, 7)}`;

            return (
              <tr key={date} className="border-t hairline">
                <td className="p-2 align-top">
                  <div className="font-semibold tabular-nums whitespace-nowrap">{dayLabel}</div>
                  <div className="text-[10px] text-graphite">{formatDayName(date)}</div>
                  {canBookFullDay && (
                    <button
                      type="button"
                      className="mt-1.5 w-full rounded border border-primary/30 bg-white px-1 py-1 text-[9px] font-semibold leading-tight text-primary-deep hover:bg-primary-soft/25"
                      onClick={() => handleSelect!("full_day")}
                    >
                      Penuh hari
                    </button>
                  )}
                </td>

                {fullDayBooking ? (
                  <td colSpan={2} className="p-1 border-l hairline align-top">
                    <OccupiedCell
                      booking={fullDayBooking}
                      fullDay
                      onDetail={onBookingDetail}
                    />
                  </td>
                ) : (
                  <>
                    <td className="p-1 border-l hairline align-top">
                      {amBooking ? (
                        <OccupiedCell booking={amBooking} onDetail={onBookingDetail} />
                      ) : (
                        <EmptyCell
                          slot="am"
                          onSelect={handleSelect ? () => handleSelect("am") : undefined}
                        />
                      )}
                    </td>
                    <td className="p-1 border-l hairline align-top">
                      {pmBooking ? (
                        <OccupiedCell booking={pmBooking} onDetail={onBookingDetail} />
                      ) : (
                        <EmptyCell
                          slot="pm"
                          onSelect={handleSelect ? () => handleSelect("pm") : undefined}
                        />
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function BookingDetailDialog({
  booking,
  roomName,
  onClose,
}: {
  booking: BookingLike;
  roomName: string;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Tutup butiran"
        className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        className="fixed left-1/2 top-1/2 z-[60] w-[min(100%-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border hairline bg-white p-5 shadow-modal"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="booking-detail-title" className="text-base font-semibold">
            Butiran tempahan
          </h3>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border hairline text-lg text-graphite hover:text-ink"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Bilik</dt>
            <dd className="mt-0.5">{roomName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Tarikh</dt>
            <dd className="mt-0.5">{formatMalayDate(booking.date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Slot</dt>
            <dd className="mt-0.5">{formatSlot(booking.slot)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Tujuan</dt>
            <dd className="mt-0.5 font-medium">{booking.purpose}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Pemohon</dt>
            <dd className="mt-0.5">{booking.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Status</dt>
            <dd className="mt-0.5">{formatBookingStatus(booking.status)}</dd>
          </div>
        </dl>
      </div>
    </>
  );
}
