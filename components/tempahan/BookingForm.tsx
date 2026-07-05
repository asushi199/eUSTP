"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createBookingAction, type BookingFormState } from "@/lib/actions/tempahan";
import {
  formatRoom,
  formatSlot,
  getConflictingBooking,
  slots,
  type BookingLike,
  type Slot,
} from "@/lib/tempahan/booking-rules";
import { cn } from "@/lib/cn";

type RoomOption = {
  slug: string;
  name: string;
};

const initialState: BookingFormState = { ok: false, message: "" };

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BookingForm({
  pkgId,
  rooms,
  bookings,
  defaultRoomSlug,
  prefillDate,
  prefillSlot,
  prefillLabel,
  variant = "embedded",
  open = true,
  onClose,
  formId = "tempah",
}: {
  pkgId: string;
  rooms: RoomOption[];
  bookings: BookingLike[];
  defaultRoomSlug?: string;
  prefillDate?: string;
  prefillSlot?: Slot;
  prefillLabel?: string;
  variant?: "embedded" | "sheet";
  open?: boolean;
  onClose?: () => void;
  formId?: string;
}) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);
  const [room, setRoom] = useState(defaultRoomSlug ?? rooms[0]?.slug ?? "");
  const [slot, setSlot] = useState<Slot>("am");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (prefillDate) setDate(prefillDate);
    if (prefillSlot) setSlot(prefillSlot);
  }, [prefillDate, prefillSlot]);

  const conflict = useMemo(() => {
    if (!date) return undefined;
    return getConflictingBooking(bookings, room, date, slot);
  }, [bookings, date, room, slot]);

  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="pr-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tempahan baharu</p>
          <h2 className="mt-1 text-lg font-semibold lg:text-xl">Permohonan Baharu</h2>
        </div>
        <span className="status-badge shrink-0">
          <span className="status-dot bg-amber-400" />
          Perlu kelulusan
        </span>
      </div>
      <p className="mt-2 text-xs text-graphite lg:text-sm">
        Selepas permohonan dihantar, klik butang WhatsApp untuk maklumkan admin.
      </p>

      {prefillLabel && (
        <p className="mt-3 rounded-md border border-primary/25 bg-primary-soft/20 px-3 py-2 text-xs font-medium text-primary-deep lg:text-sm">
          Slot dipilih: {prefillLabel}
        </p>
      )}

      {state.message && state.ok ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-md border border-primary/20 bg-primary-soft/30 px-3 py-2 text-sm font-medium text-primary-deep">
            ✓ {state.message}
          </p>
          {state.whatsappUrl && (
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex w-full justify-center"
            >
              Hantar ke WhatsApp
            </a>
          )}
        </div>
      ) : (
        <form action={formAction} className="mt-4 space-y-4 lg:mt-5">
          <input type="hidden" name="pkg" value={pkgId} />

          <div className="grid gap-4 lg:grid-cols-1">
            <div>
              <label className="label" htmlFor={`${formId}-name`}>
                Nama *
              </label>
              <input
                id={`${formId}-name`}
                name="name"
                className="input"
                placeholder="Nama pemohon"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor={`${formId}-school`}>
                Sekolah / Unit *
              </label>
              <input
                id={`${formId}-school`}
                name="school_or_unit"
                className="input"
                placeholder="Contoh: SK Sitiawan"
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor={`${formId}-purpose`}>
              Tujuan *
            </label>
            <input
              id={`${formId}-purpose`}
              name="purpose"
              className="input"
              placeholder="Contoh: Mesyuarat kurikulum"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor={`${formId}-contact`}>
              Nombor telefon *
            </label>
            <input
              id={`${formId}-contact`}
              name="contact"
              className="input"
              inputMode="tel"
              placeholder="Contoh: 0123456789"
              required
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-1">
            <div>
              <label className="label" htmlFor={`${formId}-date`}>
                Tarikh *
              </label>
              <input
                id={`${formId}-date`}
                name="date"
                type="date"
                className="input"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor={`${formId}-room`}>
                Bilik *
              </label>
              <select
                id={`${formId}-room`}
                name="room"
                className="input"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              >
                {rooms.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {titleCase(item.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor={`${formId}-slot`}>
              Slot *
            </label>
            <select
              id={`${formId}-slot`}
              name="slot"
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

          {conflict && (
            <p className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
              {formatRoom(rooms, room)} pada {date} untuk slot {formatSlot(slot)} sedang ditempah /
              menunggu kelulusan oleh <strong>{conflict.name}</strong>.
            </p>
          )}

          {state.message && !state.ok && (
            <p className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={pending || Boolean(conflict)}
          >
            {pending ? "Menghantar…" : "Hantar Permohonan"}
          </button>
        </form>
      )}
    </>
  );

  if (variant === "sheet") {
    if (!open) return null;

    return (
      <>
        <button
          type="button"
          aria-label="Tutup borang tempahan"
          className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[1px]"
          onClick={onClose}
        />
        <section
          id={formId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${formId}-title`}
          className={cn(
            "booking-sheet fixed bottom-0 left-0 right-0 z-[60] max-h-[92vh] overflow-y-auto",
            "rounded-t-2xl border-t border-fog bg-white p-5 pb-8 shadow-modal",
          )}
        >
          {onClose && (
            <button
              type="button"
              aria-label="Tutup"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border hairline bg-cloud text-lg text-graphite hover:text-ink"
              onClick={onClose}
            >
              ×
            </button>
          )}
          <div id={`${formId}-title`}>{body}</div>
        </section>
      </>
    );
  }

  return (
    <section id={formId} className="card scroll-mt-24 p-4 lg:p-6">
      {body}
    </section>
  );
}
