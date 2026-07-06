import Link from "next/link";
import AdminBookingActions from "@/components/tempahan/AdminBookingActions";
import { formatBookingStatus, formatSlot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";
import type { BookingRow } from "@/lib/tempahan/queries";

const STATUS_DOT: Record<string, string> = {
  pending: "bg-graphite",
  approved: "bg-primary",
  rejected: "bg-bloom-deep",
  cancelled: "bg-steel",
};

/**
 * Kad satu tempahan bilik. `bare` untuk item dalam senarai/kalendar terkumpul;
 * default penuh `.card` untuk gilir tindakan. Butang tindakan muncul bila
 * pending; pautan urus kehadiran/QR muncul bila approved.
 */
export default function BookingCard({
  pkgId,
  booking,
  roomName,
  bare = false,
  showDate = true,
}: {
  pkgId: string;
  booking: BookingRow;
  roomName: string;
  bare?: boolean;
  showDate?: boolean;
}) {
  const meta = [
    showDate ? formatMalayDate(booking.date) : null,
    formatSlot(booking.slot),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn(bare ? "rounded-lg border border-fog/70 bg-white p-4" : "card p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-graphite">{roomName}</p>
          <p className="mt-0.5 font-semibold leading-snug">{booking.purpose}</p>
        </div>
        <span className="status-badge shrink-0">
          <span className={cn("status-dot", STATUS_DOT[booking.status] ?? "bg-graphite")} />
          {formatBookingStatus(booking.status)}
        </span>
      </div>

      {meta && <p className="mt-2 text-sm text-graphite">{meta}</p>}

      <p className="mt-1 text-sm">
        <span className="font-medium">{booking.name}</span>
        <span className="text-graphite">
          {" · "}
          {booking.schoolOrUnit} · {booking.contact}
        </span>
      </p>

      {booking.status === "approved" && booking.attendanceManageToken && (
        <p className="mt-2">
          <Link
            href={`/tempahan/${pkgId}/urus-hadir/${booking.attendanceManageToken}`}
            className="link-blue text-xs"
          >
            Urus kehadiran / QR
          </Link>
        </p>
      )}

      {booking.status === "pending" && (
        <div className="mt-3">
          <AdminBookingActions pkgId={pkgId} bookingId={booking.id} status={booking.status} />
        </div>
      )}
    </div>
  );
}
