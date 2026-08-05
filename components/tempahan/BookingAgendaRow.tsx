"use client";

import { useState } from "react";
import Link from "next/link";
import AgendaRow from "@/components/admin-month/AgendaRow";
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
 * Baris tempahan ringkas + panel butiran/tindakan. Untuk gilir pending di telefon
 * dan mana-mana tempat yang perlukan expand tanpa kad penuh sentiasa terbuka.
 */
export default function BookingAgendaRow({
  pkgId,
  booking,
  roomName,
}: {
  pkgId: string;
  booking: BookingRow;
  roomName: string;
}) {
  const [open, setOpen] = useState(false);

  const useAutosijil = Boolean(booking.autosijilEventId || booking.cetakToken);
  const legacyManage =
    !useAutosijil && booking.attendanceManageToken
      ? `/tempahan/${pkgId}/urus-hadir/${booking.attendanceManageToken}`
      : null;

  return (
    <div className="rounded-lg border border-fog/70 bg-white px-2 py-1">
      <AgendaRow
        date={booking.date}
        timeLabel={formatSlot(booking.slot)}
        title={booking.purpose}
        badgeLabel={roomName}
        meta={`${booking.name} · ${booking.schoolOrUnit}`}
        status={booking.status}
        open={open}
        onOpenChange={setOpen}
      >
        <div className="space-y-2 rounded-md border border-fog bg-cloud/30 px-3 py-2.5 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-graphite">{roomName}</p>
              <p className="font-semibold leading-snug">{booking.purpose}</p>
            </div>
            <span className="status-badge shrink-0">
              <span className={cn("status-dot", STATUS_DOT[booking.status] ?? "bg-graphite")} />
              {formatBookingStatus(booking.status)}
            </span>
          </div>
          <p className="text-graphite">
            {formatMalayDate(booking.date)} · {formatSlot(booking.slot)}
          </p>
          <p>
            <span className="font-medium">{booking.name}</span>
            <span className="text-graphite">
              {" · "}
              {booking.schoolOrUnit} · {booking.contact}
            </span>
          </p>
          {booking.status === "approved" && legacyManage ? (
            <p>
              <Link href={legacyManage} className="link-blue text-xs">
                Urus kehadiran / QR (lama)
              </Link>
            </p>
          ) : null}
          <AdminBookingActions
            pkgId={pkgId}
            bookingId={booking.id}
            status={booking.status}
            currentDate={booking.date}
            currentSlot={booking.slot}
            applicantName={booking.name}
            applicantPhone={booking.contact}
            roomName={roomName}
            purpose={booking.purpose}
            autosijilSyncStatus={booking.autosijilSyncStatus}
            autosijilSyncError={booking.autosijilSyncError}
            cetakToken={booking.cetakToken}
            autosijilAdminUrl={booking.autosijilAdminUrl}
            requiresCertificate={booking.requiresCertificate}
          />
        </div>
      </AgendaRow>
    </div>
  );
}
