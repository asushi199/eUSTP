"use client";

import { useActionState, useMemo, useState } from "react";
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
      ),
    [state.requests],
  );
  const activeMonth = monthOptions.includes(selectedMonth) ? selectedMonth : "";
  const visibleRequests = useMemo(
    () =>
      activeMonth
        ? state.requests.filter(
            (request) => malaysiaMonth(request.createdAt) === activeMonth,
          )
        : state.requests,
    [activeMonth, state.requests],
  );
  const groupedRequests = useMemo(
    () =>
      visibleRequests.reduce<
        Array<{ month: string; label: string; requests: typeof visibleRequests }>
      >((groups, request) => {
        const date = new Date(request.createdAt);
        const month = malaysiaMonth(date);
        const existing = groups.find((group) => group.month === month);
        if (existing) {
          existing.requests.push(request);
        } else {
          groups.push({
            month,
            label: new Intl.DateTimeFormat("ms-MY", {
              month: "long",
              year: "numeric",
              timeZone: "Asia/Kuala_Lumpur",
            }).format(date),
            requests: [request],
          });
        }
        return groups;
      }, []),
    [visibleRequests],
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="label" htmlFor="equipment-check-month">
              Bulan permohonan
            </label>
            <select
              id="equipment-check-month"
              className="input mt-1 w-full min-w-56 sm:w-auto"
              value={activeMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              <option value="">Semua bulan</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {new Intl.DateTimeFormat("ms-MY", {
                    month: "long",
                    year: "numeric",
                    timeZone: "Asia/Kuala_Lumpur",
                  }).format(new Date(`${month}-01T00:00:00+08:00`))}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm font-semibold text-charcoal">
            {visibleRequests.length} permohonan
          </p>
        </div>
      ) : null}

      <div className="space-y-7">
        {groupedRequests.map((group) => (
          <section key={group.month}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-semibold capitalize text-ink">
                {group.label}
              </h2>
              <span className="h-px flex-1 bg-fog" />
              <span className="text-xs tabular-nums text-graphite">
                {group.requests.length}
              </span>
            </div>
            <div className="space-y-4">
              {group.requests.map((request) => (
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

                  {request.decisionNote ? (
                    <p className="mt-4 text-sm leading-relaxed text-charcoal">
                      <span className="font-semibold">Catatan:</span>{" "}
                      {request.decisionNote}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
