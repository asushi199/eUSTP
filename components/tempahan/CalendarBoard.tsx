import {
  getSlotBooking,
  type BookingLike,
} from "@/lib/tempahan/booking-rules";
import { formatDayName, formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

const toneStyles = {
  available: "border-primary/25 bg-primary-soft/20 text-primary-deep",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  booked: "border-fog bg-cloud text-graphite",
};

export default function CalendarBoard({
  roomSlug,
  roomName,
  bookings,
  dates,
}: {
  roomSlug: string;
  roomName: string;
  bookings: BookingLike[];
  dates: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="hidden min-w-[480px] grid-cols-[120px_1fr_1fr] gap-2 border-b hairline pb-2 text-xs font-semibold uppercase tracking-wide text-graphite sm:grid">
        <div>Tarikh</div>
        <div className="text-center">Pagi</div>
        <div className="text-center">Petang</div>
      </div>

      <div className="min-w-[480px] space-y-2">
        {dates.map((date) => (
          <div
            key={date}
            className="grid grid-cols-1 gap-2 border-b hairline py-2 last:border-0 sm:grid-cols-[120px_1fr_1fr]"
          >
            <div className="flex items-center gap-2 sm:block sm:py-2">
              <strong className="text-sm">{formatDayName(date)}</strong>
              <span className="text-xs text-graphite">
                {formatMalayDate(date, { year: undefined })}
              </span>
            </div>

            {(["am", "pm"] as const).map((slot) => {
              const booking = getSlotBooking(bookings, roomSlug, date, slot);
              const isFullDay = booking?.slot === "full_day";
              const statusLabel =
                booking?.status === "pending" ? "Menunggu Kelulusan" : "Diluluskan";
              const tone = booking
                ? booking.status === "pending"
                  ? "pending"
                  : "booked"
                : "available";

              return (
                <div
                  key={slot}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    toneStyles[tone],
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {slot === "am" ? "Pagi" : "Petang"}
                  </span>
                  <p className="mt-0.5 text-xs text-graphite sm:hidden">{titleCase(roomName)}</p>
                  {booking ? (
                    <>
                      <p className="mt-1 line-clamp-2 font-medium" title={booking.purpose}>
                        {booking.purpose}
                      </p>
                      <p className="mt-0.5 text-xs opacity-80">
                        {booking.name} · {statusLabel}
                      </p>
                      {isFullDay && (
                        <span className="mt-1 inline-block rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold">
                          Penuh hari
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="mt-1 block font-medium">Kosong</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
