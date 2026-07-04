"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createBookingAction, type BookingFormState } from "@/lib/actions/tempahan";
import {
  isSlotAvailable,
  slots,
  type BookingLike,
  type Slot,
} from "@/lib/tempahan/booking-rules";
import { formatDayName, fromIsoDate, listDateRange } from "@/lib/tempahan/date";
import { cn } from "@/lib/cn";

type RoomInfo = {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  imageSrc: string | null;
  amenities: string[];
};

const initialState: BookingFormState = { ok: false, message: "" };

export default function BookingBoard({
  pkgId,
  rooms,
  bookings,
  today,
}: {
  pkgId: string;
  rooms: RoomInfo[];
  bookings: BookingLike[];
  today: string;
}) {
  const dates = useMemo(() => listDateRange(today, 14), [today]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.slug ?? "");
  const [selectedSlot, setSelectedSlot] = useState<Slot>("am");
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);

  function pickSlot(roomSlug: string, slot: Slot) {
    setSelectedRoom(roomSlug);
    setSelectedSlot(slot);
    document.getElementById("borang-tempahan")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="space-y-8">
      {/* Pilih tarikh */}
      <section>
        <h2 className="text-lg font-semibold">1. Pilih Tarikh</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => {
            const active = d === selectedDate;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={cn(
                  "flex min-w-[64px] flex-col items-center rounded-lg border px-3 py-2 text-sm transition",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-fog bg-white text-ink hover:border-steel",
                )}
              >
                <span className={cn("text-[11px]", active ? "text-white/80" : "text-graphite")}>
                  {formatDayName(d)}
                </span>
                <span className="font-semibold">{fromIsoDate(d).getDate()}</span>
                <span className={cn("text-[11px]", active ? "text-white/80" : "text-graphite")}>
                  {fromIsoDate(d).toLocaleDateString("ms-MY", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid kekosongan */}
      <section>
        <h2 className="text-lg font-semibold">2. Pilih Bilik & Slot</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
                <th className="px-4 py-3 font-semibold">Bilik</th>
                {slots.map((s) => (
                  <th key={s.id} className="px-4 py-3 text-center font-semibold">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.slug} className="border-b hairline last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tempahan/${pkgId}/bilik/${room.slug}`}
                      className="font-medium hover:text-primary"
                    >
                      {room.name}
                    </Link>
                    {room.category && (
                      <p className="text-xs text-graphite">{room.category}</p>
                    )}
                  </td>
                  {slots.map((s) => {
                    const available = isSlotAvailable(
                      bookings,
                      room.slug,
                      selectedDate,
                      s.id,
                    );
                    const isPicked =
                      selectedRoom === room.slug && selectedSlot === s.id;
                    return (
                      <td key={s.id} className="px-2 py-2 text-center">
                        {available ? (
                          <button
                            type="button"
                            onClick={() => pickSlot(room.slug, s.id)}
                            className={cn(
                              "w-full rounded-md border px-2 py-1.5 text-xs font-semibold transition",
                              isPicked
                                ? "border-primary bg-primary text-white"
                                : "border-primary/40 text-primary hover:bg-primary-soft/30",
                            )}
                          >
                            {isPicked ? "Dipilih" : "Kosong"}
                          </button>
                        ) : (
                          <span className="inline-block w-full rounded-md bg-cloud px-2 py-1.5 text-xs text-graphite">
                            Ditempah
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Borang tempahan */}
      <section id="borang-tempahan">
        <h2 className="text-lg font-semibold">3. Maklumat Pemohon</h2>

        {state.message && state.ok ? (
          <div className="card mt-3 p-6">
            <p className="font-semibold text-primary-deep">✓ {state.message}</p>
            {state.whatsappUrl && (
              <a
                href={state.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-4 inline-flex"
              >
                Hantar WhatsApp kepada Admin
              </a>
            )}
            <p className="mt-3 text-xs text-graphite">
              Status tempahan boleh disemak di halaman &quot;Semak Tempahan Saya&quot;.
            </p>
          </div>
        ) : (
          <form action={formAction} className="card mt-3 space-y-4 p-6">
            <input type="hidden" name="pkg" value={pkgId} />
            <input type="hidden" name="date" value={selectedDate} />
            <input type="hidden" name="room" value={selectedRoom} />
            <input type="hidden" name="slot" value={selectedSlot} />

            <p className="rounded-md bg-cloud px-3 py-2 text-sm">
              Tempahan:{" "}
              <span className="font-semibold">
                {rooms.find((r) => r.slug === selectedRoom)?.name ?? "-"}
              </span>{" "}
              · {selectedDate} ·{" "}
              <span className="font-semibold">
                {slots.find((s) => s.id === selectedSlot)?.label}
              </span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">
                  Nama Pemohon *
                </label>
                <input id="name" name="name" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="school_or_unit">
                  Sekolah / Unit *
                </label>
                <input id="school_or_unit" name="school_or_unit" className="input" required />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="purpose">
                  Tujuan *
                </label>
                <input id="purpose" name="purpose" className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="contact">
                  No. Telefon *
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
            </div>

            {state.message && !state.ok && (
              <p className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
                {state.message}
              </p>
            )}

            <button type="submit" className="btn-primary" disabled={pending || !selectedRoom}>
              {pending ? "Menghantar…" : "Hantar Tempahan"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
