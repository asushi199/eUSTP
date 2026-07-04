"use client";

import { useActionState } from "react";
import { semakTempahanAction, type CheckBookingState } from "@/lib/actions/tempahan";

const initialState: CheckBookingState = { ok: false, message: "", bookings: [] };

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
        <p className="text-sm text-graphite">{state.message}</p>
      )}

      {state.bookings.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
                <th className="px-4 py-3 font-semibold">Tarikh</th>
                <th className="px-4 py-3 font-semibold">Bilik</th>
                <th className="px-4 py-3 font-semibold">Slot</th>
                <th className="px-4 py-3 font-semibold">Tujuan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.bookings.map((b) => (
                <tr key={b.id} className="border-b hairline last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{b.date}</td>
                  <td className="px-4 py-3">{roomNames[b.roomSlug] ?? b.roomSlug}</td>
                  <td className="px-4 py-3">{b.slot}</td>
                  <td className="px-4 py-3">{b.purpose}</td>
                  <td className="px-4 py-3">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
