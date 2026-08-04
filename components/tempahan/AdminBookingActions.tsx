"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminApproveBooking,
  adminCancelBooking,
  adminDeleteBooking,
  adminRejectBooking,
  adminUpdateBookingSchedule,
} from "@/lib/actions/tempahan-admin";
import {
  canDeleteBookingFromAdmin,
  canEditBookingFromAdmin,
} from "@/lib/tempahan/admin-booking";
import {
  formatSlot,
  slots,
  type BookingStatus,
  type Slot,
} from "@/lib/tempahan/booking-rules";

export default function AdminBookingActions({
  pkgId,
  bookingId,
  status,
  currentDate,
  currentSlot,
}: {
  pkgId: string;
  bookingId: string;
  status: BookingStatus;
  currentDate: string;
  currentSlot: Slot;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(currentDate);
  const [slot, setSlot] = useState<Slot>(currentSlot);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "Tindakan gagal.");
        return;
      }
      router.refresh();
    });
  }

  function saveSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("date", date);
    fd.set("slot", slot);
    startTransition(async () => {
      const res = await adminUpdateBookingSchedule(pkgId, bookingId, fd);
      if (!res.ok) {
        setError(res.error ?? "Tarikh tempahan tidak dapat dikemas kini.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" && (
          <>
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={pending}
              onClick={() => run(() => adminApproveBooking(pkgId, bookingId))}
            >
              Lulus
            </button>
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={pending}
              onClick={() => run(() => adminRejectBooking(pkgId, bookingId))}
            >
              Tolak
            </button>
          </>
        )}
        {canEditBookingFromAdmin(status) && (
          <button
            type="button"
            className="text-sm font-medium text-ink hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() => {
              setDate(currentDate);
              setSlot(currentSlot);
              setError(null);
              setEditing((value) => !value);
            }}
          >
            Ubah tarikh
          </button>
        )}
        {(status === "pending" || status === "approved") && (
          <button
            type="button"
            className="text-sm font-medium text-bloom-deep hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              run(
                () => adminCancelBooking(pkgId, bookingId),
                "Batalkan tempahan ini?",
              )
            }
          >
            Batal
          </button>
        )}
        {canDeleteBookingFromAdmin(status) && (
          <button
            type="button"
            className="text-sm font-medium text-bloom-deep hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              run(
                () => adminDeleteBooking(pkgId, bookingId),
                "Padam tempahan ini secara kekal? Rekod kehadiran yang berkaitan juga akan dipadam.",
              )
            }
          >
            Padam
          </button>
        )}
      </div>
      {editing && (
        <form onSubmit={saveSchedule} className="mt-3 space-y-3 rounded-lg border border-fog/80 bg-cloud/30 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`date-${bookingId}`}>
                Tarikh
              </label>
              <input
                id={`date-${bookingId}`}
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor={`slot-${bookingId}`}>
                Slot
              </label>
              <select
                id={`slot-${bookingId}`}
                className="input"
                value={slot}
                onChange={(e) => setSlot(e.target.value as Slot)}
              >
                {slots.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-graphite">
            Tarikh semasa: {currentDate} · {formatSlot(currentSlot)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary btn-sm" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan tarikh"}
            </button>
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              Tutup
            </button>
          </div>
        </form>
      )}
      {error && <p className="mt-1 text-xs text-bloom-deep">{error}</p>}
    </div>
  );
}
