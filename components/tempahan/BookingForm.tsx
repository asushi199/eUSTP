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
}: {
  pkgId: string;
  rooms: RoomOption[];
  bookings: BookingLike[];
  defaultRoomSlug?: string;
  prefillDate?: string;
  prefillSlot?: Slot;
  prefillLabel?: string;
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

  return (
    <section id="tempah" className="card scroll-mt-24 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tempahan baharu</p>
          <h2 className="mt-1 text-lg font-semibold sm:text-xl">Permohonan Baharu</h2>
        </div>
        <span className="status-badge">
          <span className="status-dot bg-amber-400" />
          Perlu kelulusan
        </span>
      </div>
      <p className="mt-2 text-xs text-graphite sm:text-sm">
        Selepas permohonan dihantar, klik butang WhatsApp untuk maklumkan admin.
      </p>

      {prefillLabel && (
        <p className="mt-3 rounded-md border border-primary/25 bg-primary-soft/20 px-3 py-2 text-xs font-medium text-primary-deep sm:text-sm">
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
              className="btn-primary inline-flex w-full justify-center sm:w-auto"
            >
              Hantar ke WhatsApp
            </a>
          )}
        </div>
      ) : (
        <form action={formAction} className="mt-4 space-y-4 sm:mt-5">
          <input type="hidden" name="pkg" value={pkgId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Nama *
              </label>
              <input id="name" name="name" className="input" placeholder="Nama pemohon" required />
            </div>
            <div>
              <label className="label" htmlFor="school_or_unit">
                Sekolah / Unit *
              </label>
              <input
                id="school_or_unit"
                name="school_or_unit"
                className="input"
                placeholder="Contoh: SK Sitiawan"
                required
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="purpose">
              Tujuan *
            </label>
            <input
              id="purpose"
              name="purpose"
              className="input"
              placeholder="Contoh: Mesyuarat kurikulum"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="contact">
              Nombor telefon *
            </label>
            <input
              id="contact"
              name="contact"
              className="input"
              inputMode="tel"
              placeholder="Contoh: 0123456789"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="date">
                Tarikh *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                className="input"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="room">
                Bilik *
              </label>
              <select
                id="room"
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
            <label className="label" htmlFor="slot">
              Slot *
            </label>
            <select
              id="slot"
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
            className="btn-primary w-full sm:w-auto"
            disabled={pending || Boolean(conflict)}
          >
            {pending ? "Menghantar…" : "Hantar Permohonan"}
          </button>
        </form>
      )}
    </section>
  );
}
