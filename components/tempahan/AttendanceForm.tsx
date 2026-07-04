"use client";

import { useActionState } from "react";
import {
  registerAttendanceAction,
  type AttendanceFormState,
} from "@/lib/actions/tempahan";

const initialState: AttendanceFormState = { ok: false, message: "" };

export default function AttendanceForm({
  pkgId,
  token,
}: {
  pkgId: string;
  token: string;
}) {
  const [state, formAction, pending] = useActionState(
    registerAttendanceAction,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl">✓</p>
        <p className="mt-2 font-semibold text-primary-deep">{state.message}</p>
        {typeof state.count === "number" && (
          <p className="mt-1 text-sm text-graphite">
            Jumlah kehadiran setakat ini: {state.count}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <input type="hidden" name="pkg" value={pkgId} />
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="name">
          Nama Penuh *
        </label>
        <input id="name" name="name" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="contact">
          Telefon / Emel *
        </label>
        <input id="contact" name="contact" className="input" required />
      </div>
      {state.message && (
        <p className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Merekod…" : "Daftar Kehadiran"}
      </button>
    </form>
  );
}
