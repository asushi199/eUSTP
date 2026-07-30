"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import PhoneInput from "@/components/PhoneInput";
import { semakTempahanAction, type CheckBookingState } from "@/lib/actions/tempahan";
import { formatBookingStatus, formatSlot, type Slot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";

const initialState: CheckBookingState = { ok: false, message: "", bookings: [] };

const STATUS_DOT: Record<string, string> = {
  pending: "bg-graphite",
  approved: "bg-primary",
};

function bookingMonth(date: string) {
  return date.slice(0, 7);
}

function malaysiaMonthLabel(month: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(`${month}-01T00:00:00+08:00`));
}

export default function SemakForm({
  pkgId,
  roomNames,
}: {
  pkgId: string;
  roomNames: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(semakTempahanAction, initialState);
  const [selectedMonth, setSelectedMonth] = useState("");
  const monthOptions = useMemo(
    () =>
      Array.from(new Set(state.bookings.map((booking) => bookingMonth(booking.date)))).sort(
        (a, b) => b.localeCompare(a),
      ),
    [state.bookings],
  );
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const defaultMonth = monthOptions.includes(currentMonth)
    ? currentMonth
    : (monthOptions[0] ?? "");
  const activeMonth = monthOptions.includes(selectedMonth)
    ? selectedMonth
    : defaultMonth;
  const visibleBookings = useMemo(
    () => state.bookings.filter((booking) => bookingMonth(booking.date) === activeMonth),
    [activeMonth, state.bookings],
  );
  const activeMonthIndex = monthOptions.indexOf(activeMonth);

  useEffect(() => {
    setSelectedMonth("");
  }, [state.bookings]);

  function selectMonth(offset: number) {
    const next = monthOptions[activeMonthIndex + offset];
    if (next) setSelectedMonth(next);
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
        <input type="hidden" name="pkg" value={pkgId} />
        <div className="flex-1">
          <label className="label" htmlFor="contact">
            No. Telefon (semasa tempahan)
          </label>
          <PhoneInput
            id="contact"
            name="contact"
            placeholder="cth. 0123456789"
            required
          />
        </div>
        <button type="submit" className="btn-primary shrink-0" disabled={pending}>
          {pending ? "Menyemak…" : "Semak"}
        </button>
      </form>

      {state.message && (
        <p
          className={cn(
            "text-sm",
            state.ok ? "text-graphite" : "text-bloom-deep",
          )}
        >
          {state.message}
        </p>
      )}

      {state.bookings.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 border-y border-fog py-3">
            <button
              type="button"
              onClick={() => selectMonth(1)}
              disabled={activeMonthIndex >= monthOptions.length - 1}
              aria-label="Bulan tempahan sebelumnya"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-fog text-lg text-graphite transition hover:border-steel hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
            >
              ←
            </button>
            <p className="text-center text-sm font-semibold capitalize text-ink">
              {malaysiaMonthLabel(activeMonth)}
              <span className="font-normal text-graphite"> · {visibleBookings.length}</span>
            </p>
            <button
              type="button"
              onClick={() => selectMonth(-1)}
              disabled={activeMonthIndex <= 0}
              aria-label="Bulan tempahan seterusnya"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-fog text-lg text-graphite transition hover:border-steel hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
            >
              →
            </button>
          </div>

          <div className="space-y-3">
          {visibleBookings.map((b) => {
            const roomName = roomNames[b.roomSlug] ?? b.roomSlug;
            const meta = [formatMalayDate(b.date), formatSlot(b.slot as Slot)]
              .filter(Boolean)
              .join(" · ");

            return (
              <div key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-graphite">{roomName}</p>
                    <p className="mt-0.5 font-semibold leading-snug">{b.purpose}</p>
                  </div>
                  <span className="status-badge shrink-0">
                    <span
                      className={cn("status-dot", STATUS_DOT[b.status] ?? "bg-graphite")}
                    />
                    {formatBookingStatus(b.status)}
                  </span>
                </div>

                {meta && <p className="mt-2 text-sm text-graphite">{meta}</p>}

                <div className="mt-3 space-y-2">
                  {b.whatsappUrl ? (
                    <a
                      href={b.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-ink inline-flex w-full justify-center"
                    >
                      Hantar WhatsApp kepada admin
                    </a>
                  ) : null}
                  {b.manageUrl ? (
                    <Link href={b.manageUrl} className="btn-primary inline-flex w-full justify-center">
                      Urus kehadiran
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
