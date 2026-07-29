"use client";

import { useActionState } from "react";
import PhoneInput from "@/components/PhoneInput";
import {
  checkEquipmentLoansAction,
  type EquipmentLookupState,
} from "@/lib/actions/peralatan";
import { EQUIPMENT_LOAN_STATUS_LABEL } from "@/lib/peralatan/status";

const initialState: EquipmentLookupState = {
  ok: false,
  message: "",
  requests: [],
};

export default function EquipmentLoanLookup() {
  const [state, formAction, pending] = useActionState(
    checkEquipmentLoansAction,
    initialState,
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="card p-5 sm:p-6">
        <label className="label" htmlFor="equipment-check-phone">
          Nombor telefon pemohon
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <PhoneInput
            id="equipment-check-phone"
            name="contact"
            placeholder="Contoh: 0123456789"
            required
          />
          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={pending}
          >
            {pending ? "Menyemak..." : "Semak permohonan"}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-graphite">
          Gunakan nombor telefon yang sama seperti dalam borang permohonan.
        </p>
      </form>

      {state.message ? (
        <p
          className={`rounded-lg border p-4 text-sm ${
            state.ok
              ? "border-primary/20 bg-primary-soft/25 text-charcoal"
              : "border-bloom-rose bg-bloom-rose/30 text-bloom-deep"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="space-y-4">
        {state.requests.map((request) => (
          <article key={request.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.11em] text-primary">
                  {request.referenceNo}
                </p>
                <h2 className="mt-1 font-semibold text-ink">{request.pkgName}</h2>
                <p className="mt-1 text-xs text-graphite">{request.orgName}</p>
              </div>
              <span className="status-badge">
                {EQUIPMENT_LOAN_STATUS_LABEL[request.status]}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 border-t border-fog pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                  Tempoh pinjaman
                </dt>
                <dd className="mt-1 font-medium text-ink">
                  {request.borrowDate} hingga {request.expectedReturnDate}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                  Dihantar
                </dt>
                <dd className="mt-1 font-medium text-ink">
                  {new Date(request.createdAt).toLocaleString("ms-MY")}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-lg bg-cloud p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                Peralatan
              </p>
              <ul className="mt-2 space-y-1 text-sm text-charcoal">
                {request.items.map((item) => (
                  <li key={item.name}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>

            {request.decisionNote ? (
              <p className="mt-4 text-sm leading-relaxed text-charcoal">
                <span className="font-semibold">Catatan:</span>{" "}
                {request.decisionNote}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
