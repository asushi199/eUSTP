"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import PhoneInput from "@/components/PhoneInput";
import { createBookingAction, type BookingFormState } from "@/lib/actions/tempahan";
import {
  formatRoom,
  formatSlot,
  getBatchConflicts,
  slots,
  type BookingLike,
  type Slot,
} from "@/lib/tempahan/booking-rules";
import {
  formatDayName,
  formatMalayDate,
  isWithinBookingDayLimit,
  listInclusiveDates,
  MAX_BOOKING_DAYS,
} from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";
import RoomCapacityBadge from "./RoomCapacityBadge";

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
  roomCapacity,
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
  roomCapacity?: number | null;
  variant?: "embedded" | "sheet";
  open?: boolean;
  onClose?: () => void;
  formId?: string;
}) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);
  const [room, setRoom] = useState(defaultRoomSlug ?? rooms[0]?.slug ?? "");
  const [date, setDate] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [daySlots, setDaySlots] = useState<Record<string, Slot>>({});

  useEffect(() => {
    if (prefillDate) {
      setDate(prefillDate);
      setDateEnd(prefillDate);
    }
    if (prefillSlot && prefillDate) {
      setDaySlots((prev) => ({ ...prev, [prefillDate]: prefillSlot }));
    }
  }, [prefillDate, prefillSlot]);

  const rangeDates = useMemo(() => {
    if (!date) return null;
    const end = dateEnd || date;
    return listInclusiveDates(date, end);
  }, [date, dateEnd]);

  const rangeValid = Boolean(rangeDates && isWithinBookingDayLimit(rangeDates.length));
  const multiDay = Boolean(rangeDates && rangeDates.length > 1);

  useEffect(() => {
    if (!rangeDates || !isWithinBookingDayLimit(rangeDates.length)) return;
    setDaySlots((prev) => {
      const next: Record<string, Slot> = {};
      for (const d of rangeDates) {
        next[d] = prev[d] ?? (d === prefillDate && prefillSlot ? prefillSlot : "full_day");
      }
      return next;
    });
  }, [rangeDates, prefillDate, prefillSlot]);

  const dayRequests = useMemo(() => {
    if (!rangeValid || !rangeDates) return [];
    return rangeDates.map((d) => ({
      date: d,
      slot: daySlots[d] ?? "full_day",
    }));
  }, [rangeValid, rangeDates, daySlots]);

  const conflicts = useMemo(() => {
    if (dayRequests.length === 0) return [];
    return getBatchConflicts(bookings, room, dayRequests);
  }, [bookings, room, dayRequests]);

  const rangeError = useMemo(() => {
    if (!date) return "";
    const end = dateEnd || date;
    if (end < date) return "Tarikh tamat mestilah pada atau selepas tarikh mula.";
    if (!rangeDates) return "Julat tarikh tidak sah.";
    if (!isWithinBookingDayLimit(rangeDates.length)) {
      return `Maksimum ${MAX_BOOKING_DAYS} hari setiap permohonan (termasuk tarikh mula dan tamat).`;
    }
    return "";
  }, [date, dateEnd, rangeDates]);

  function setSlotForDate(isoDate: string, nextSlot: Slot) {
    setDaySlots((prev) => ({ ...prev, [isoDate]: nextSlot }));
  }

  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="pr-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tempahan baharu</p>
          <h2 className="mt-1 text-lg font-semibold xl:text-xl">Permohonan Baharu</h2>
        </div>
        <span className="status-badge shrink-0">
          <span className="status-dot bg-amber-400" />
          Perlu kelulusan
        </span>
      </div>
      <p className="mt-2 text-xs text-graphite xl:text-sm">
        Boleh tempah sehingga {MAX_BOOKING_DAYS} hari berturut-turut. Sistem akan memaklumkan
        pentadbir selepas permohonan dihantar.
      </p>

      <RoomCapacityBadge capacity={roomCapacity} prominent className="mt-3" />

      {prefillLabel && (
        <p className="mt-3 rounded-md border border-primary/25 bg-primary-soft/20 px-3 py-2 text-xs font-medium text-primary-deep xl:text-sm">
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
        <form action={formAction} className="mt-4 space-y-4 xl:mt-5">
          <input type="hidden" name="pkg" value={pkgId} />

          <div className="grid gap-4 xl:grid-cols-1">
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
            <PhoneInput
              id={`${formId}-contact`}
              name="contact"
              placeholder="Contoh: 0123456789"
              required
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`${formId}-date`}>
                Tarikh mula *
              </label>
              <input
                id={`${formId}-date`}
                name="date"
                type="date"
                className="input"
                required
                value={date}
                onChange={(e) => {
                  const next = e.target.value;
                  setDate(next);
                  if (!dateEnd || dateEnd < next) setDateEnd(next);
                }}
              />
            </div>
            <div>
              <label className="label" htmlFor={`${formId}-date-end`}>
                Tarikh tamat
              </label>
              <input
                id={`${formId}-date-end`}
                name="date_end"
                type="date"
                className="input"
                min={date || undefined}
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
              <p className="mt-1 text-xs text-graphite">
                Kosongkan atau sama dengan tarikh mula untuk tempahan sehari.
              </p>
            </div>
          </div>

          {rangeError && (
            <p className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
              {rangeError}
            </p>
          )}

          {rangeValid && dayRequests.length === 1 && (
            <div>
              <label className="label" htmlFor={`${formId}-slot`}>
                Slot *
              </label>
              <select
                id={`${formId}-slot`}
                name="slots"
                className="input"
                value={dayRequests[0]!.slot}
                onChange={(e) => setSlotForDate(dayRequests[0]!.date, e.target.value as Slot)}
              >
                {slots.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {rangeValid && multiDay && (
            <div className="space-y-3">
              <p className="label">Slot mengikut hari *</p>
              <ul className="space-y-2">
                {dayRequests.map((day) => (
                  <li
                    key={day.date}
                    className="flex flex-col gap-2 rounded-md border hairline bg-cloud/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-medium text-ink">
                      {formatDayName(day.date)}, {formatMalayDate(day.date)}
                    </span>
                    <select
                      name="slots"
                      className="input sm:max-w-[11rem]"
                      aria-label={`Slot untuk ${day.date}`}
                      value={day.slot}
                      onChange={(e) => setSlotForDate(day.date, e.target.value as Slot)}
                    >
                      {slots.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
              <p className="font-medium">
                {formatRoom(rooms, room)} — slot berikut tidak tersedia:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {conflicts.map((item) => (
                  <li key={`${item.date}-${item.slot}`}>
                    {formatMalayDate(item.date)} ({formatSlot(item.slot)}) — {item.conflict.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.message && !state.ok && (
            <p className="whitespace-pre-line rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={pending || Boolean(rangeError) || conflicts.length > 0 || !date}
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
    <section id={formId} className="card scroll-mt-24 p-4 xl:p-6">
      {body}
    </section>
  );
}
