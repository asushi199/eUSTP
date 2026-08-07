"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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

function malaysiaMonth(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

function malaysiaMonthLabel(month: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(`${month}-01T00:00:00+08:00`));
}

export default function EquipmentLoanLookup() {
  const [state, formAction, pending] = useActionState(
    checkEquipmentLoansAction,
    initialState,
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const monthOptions = useMemo(
    () =>
      Array.from(
        new Set(
          state.requests.map((request) => malaysiaMonth(request.createdAt)),
        ),
      ).sort((a, b) => b.localeCompare(a)),
    [state.requests],
  );
  const currentMonth = malaysiaMonth(new Date());
  const defaultMonth = monthOptions.includes(currentMonth)
    ? currentMonth
    : (monthOptions[0] ?? "");
  const activeMonth = monthOptions.includes(selectedMonth)
    ? selectedMonth
    : defaultMonth;
  const visibleRequests = useMemo(
    () =>
      state.requests.filter(
        (request) => malaysiaMonth(request.createdAt) === activeMonth,
      ),
    [activeMonth, state.requests],
  );
  const activeMonthIndex = monthOptions.indexOf(activeMonth);

  useEffect(() => {
    setSelectedMonth("");
  }, [state.requests]);

  function selectMonth(offset: number) {
    const next = monthOptions[activeMonthIndex + offset];
    if (next) setSelectedMonth(next);
  }

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
          Gunakan nombor telefon yang sama seperti dalam borang permohonan. Nama
          sahaja tidak digunakan bagi melindungi rekod pemohon lain.
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

      {state.requests.length > 0 ? (
        <div className="flex items-center justify-between gap-3 border-y border-fog py-3">
          <button
            type="button"
            onClick={() => selectMonth(1)}
            disabled={activeMonthIndex >= monthOptions.length - 1}
            aria-label="Bulan permohonan sebelumnya"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-fog text-lg text-graphite transition hover:border-steel hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            ←
          </button>
          <p className="text-center text-sm font-semibold capitalize text-ink">
            {malaysiaMonthLabel(activeMonth)}
            <span className="font-normal text-graphite"> · {visibleRequests.length}</span>
          </p>
          <button
            type="button"
            onClick={() => selectMonth(-1)}
            disabled={activeMonthIndex <= 0}
            aria-label="Bulan permohonan seterusnya"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-fog text-lg text-graphite transition hover:border-steel hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            →
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {visibleRequests.map((request) => (
          <article key={request.id} className="card p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold uppercase tracking-[0.11em] text-primary">
                        {request.referenceNo}
                      </p>
                      <h2 className="mt-1 font-semibold text-ink">
                        {request.pkgName}
                      </h2>
                      <p className="mt-1 text-xs text-graphite">
                        {request.orgName}
                      </p>
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
                        {new Date(request.createdAt).toLocaleString("ms-MY", {
                          timeZone: "Asia/Kuala_Lumpur",
                        })}
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

                  {request.status === "rejected" && request.decisionNote ? (
                    <div className="mt-4 rounded-lg border border-bloom-rose bg-bloom-rose/20 p-4 text-sm leading-relaxed text-charcoal">
                      <p className="font-semibold text-bloom-deep">Catatan pegawai</p>
                      <p className="mt-1">{request.decisionNote}</p>
                    </div>
                  ) : null}

                  {request.whatsappUrl ? (
                    <a
                      href={request.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-ink mt-4 inline-flex w-full justify-center"
                    >
                      Hantar semula WhatsApp kepada pegawai PKG
                    </a>
                  ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
