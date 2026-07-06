"use client";

import Link from "next/link";
import { useActionState } from "react";
import { semakTempahanAction, type CheckBookingState } from "@/lib/actions/tempahan";
import { formatBookingStatus, formatSlot, type Slot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";

const initialState: CheckBookingState = { ok: false, message: "", bookings: [] };

const STATUS_DOT: Record<string, string> = {
  pending: "bg-graphite",
  approved: "bg-primary",
};

export default function SemakForm({
  pkgId,
  roomNames,
}: {
  pkgId: string;
  roomNames: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(semakTempahanAction, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
        <input type="hidden" name="pkg" value={pkgId} />
        <div className="flex-1">
          <label className="label" htmlFor="contact">
            No. Telefon (semasa tempahan)
          </label>
          <input
            id="contact"
            name="contact"
            className="input"
            inputMode="tel"
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
        <div className="space-y-3">
          {state.bookings.map((b) => {
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
      )}
    </div>
  );
}
