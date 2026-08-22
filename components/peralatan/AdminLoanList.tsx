"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EQUIPMENT_LOAN_WORKFLOW_ORDER,
  filterEquipmentLoans,
  type EquipmentLoanListRow,
} from "@/lib/peralatan/loan-list";
import { EQUIPMENT_LOAN_STATUS_LABEL } from "@/lib/peralatan/status";
import type { EquipmentLoanStatus } from "@/lib/peralatan/types";

const PAGE_SIZE = 25;

function LoanRow({
  pkgId,
  loan,
}: {
  pkgId: string;
  loan: EquipmentLoanListRow;
}) {
  return (
    <Link
      href={`/admin/peralatan/${pkgId}/permohonan/${loan.id}`}
      className="card grid gap-3 p-4 transition hover:shadow-modal sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-primary">
            {loan.referenceNo}
          </span>
          <span className="status-badge">
            <span
              className={`status-dot ${
                loan.status === "pending"
                  ? "bg-amber-400"
                  : loan.status === "approved" ||
                      loan.status === "handed_over" ||
                      loan.status === "returned"
                    ? "bg-primary"
                    : "bg-graphite"
              }`}
            />
            {EQUIPMENT_LOAN_STATUS_LABEL[loan.status]}
          </span>
        </div>
        <p className="mt-2 truncate font-semibold text-ink">{loan.orgName}</p>
        <p className="mt-1 text-sm text-graphite">
          {loan.schoolCode ? `${loan.schoolCode} · ` : ""}
          {loan.applicantName} · {loan.totalQuantity} unit
        </p>
      </div>
      <div className="text-sm text-graphite sm:text-right">
        <p>
          {loan.borrowDate} → {loan.expectedReturnDate}
        </p>
        <p className="mt-1 text-xs">
          Dihantar{" "}
          {new Date(loan.createdAt).toLocaleDateString("ms-MY", {
            timeZone: "Asia/Kuala_Lumpur",
          })}
        </p>
      </div>
    </Link>
  );
}

export default function AdminLoanList({
  pkgId,
  loans,
  initialMonth,
  initialStatus,
  initialSearch,
}: {
  pkgId: string;
  loans: EquipmentLoanListRow[];
  initialMonth: string;
  initialStatus: EquipmentLoanStatus | "";
  initialSearch: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [status, setStatus] = useState<EquipmentLoanStatus | "">(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);

  const pending = useMemo(
    () => filterEquipmentLoans(loans, { status: "pending" }),
    [loans],
  );
  const filtered = useMemo(
    () => filterEquipmentLoans(loans, { month, status, search }),
    [loans, month, status, search],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const showPendingQueue = !status && pending.length > 0;

  function syncUrl(
    nextMonth: string,
    nextStatus: EquipmentLoanStatus | "",
    nextSearch: string,
  ) {
    const values = new URLSearchParams();
    values.set("bulan", nextMonth);
    if (nextStatus) values.set("status", nextStatus);
    const trimmed = nextSearch.trim();
    if (trimmed) values.set("cari", trimmed);
    window.history.replaceState(
      null,
      "",
      `/admin/peralatan/${pkgId}/permohonan?${values.toString()}`,
    );
  }

  function changeMonth(nextMonth: string) {
    setMonth(nextMonth);
    setPage(1);
    syncUrl(nextMonth, status, search);
  }

  function changeStatus(nextStatus: EquipmentLoanStatus | "") {
    setStatus(nextStatus);
    setPage(1);
    syncUrl(month, nextStatus, search);
  }

  function changeSearch(nextSearch: string) {
    setSearch(nextSearch);
    setPage(1);
    syncUrl(month, status, nextSearch);
  }

  return (
    <>
      {showPendingQueue ? (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-graphite">
                Perlu tindakan
              </p>
              <h2 className="mt-1 text-lg font-semibold text-ink">
                Menunggu kelulusan
              </h2>
              <p className="mt-1 text-sm text-graphite">
                Dipaparkan tanpa mengira bulan supaya tiada permohonan tertinggal.
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-charcoal hover:text-ink"
              onClick={() => {
                setMonth("");
                setStatus("pending");
                setSearch("");
                setPage(1);
                syncUrl("", "pending", "");
              }}
            >
              Lihat semua ({pending.length})
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {pending.slice(0, 5).map((loan) => (
              <LoanRow key={loan.id} pkgId={pkgId} loan={loan} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="card p-5">
          <div>
            <h2 className="font-semibold text-ink">Tapis permohonan</h2>
            <p className="mt-1 text-sm text-graphite">
              Tapisan digunakan serta-merta. Bulan merujuk kepada tarikh pinjaman
              yang dipohon.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_210px_minmax(220px,1fr)_auto]">
            <div>
              <label className="label" htmlFor="loan-month">
                Bulan pinjaman
              </label>
              <input
                id="loan-month"
                name="bulan"
                type="month"
                className="input"
                value={month}
                onChange={(event) => changeMonth(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="loan-status">
                Status
              </label>
              <select
                id="loan-status"
                name="status"
                className="input"
                value={status}
                onChange={(event) =>
                  changeStatus(event.target.value as EquipmentLoanStatus | "")
                }
              >
                <option value="">Semua status</option>
                {EQUIPMENT_LOAN_WORKFLOW_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {EQUIPMENT_LOAN_STATUS_LABEL[value]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="loan-search">
                Cari sekolah
              </label>
              <input
                id="loan-search"
                name="cari"
                className="input"
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Kod, nama sekolah, pemohon atau no. rujukan"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-graphite">
                {filtered.length.toLocaleString("ms-MY")} permohonan sepadan
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                className="btn-outline-ink btn-sm"
                onClick={() => changeMonth("")}
                disabled={!month}
              >
                Semua bulan
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">
            Senarai mengikut tapisan
          </h2>
          <span className="text-sm font-semibold tabular-nums text-charcoal">
            {filtered.length.toLocaleString("ms-MY")} permohonan
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {pageItems.length === 0 ? (
            <div className="card p-6 text-sm text-graphite">
              Tiada permohonan sepadan. Ubah bulan, status atau kata carian.
            </div>
          ) : (
            pageItems.map((loan) => (
              <LoanRow key={loan.id} pkgId={pkgId} loan={loan} />
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <nav
            className="mt-5 flex items-center justify-between text-sm"
            aria-label="Muka surat senarai permohonan"
          >
            {currentPage > 1 ? (
              <button
                type="button"
                className="btn-outline-ink btn-sm"
                onClick={() => setPage(currentPage - 1)}
              >
                Sebelum
              </button>
            ) : (
              <span />
            )}
            <span className="text-graphite">
              Muka {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <button
                type="button"
                className="btn-outline-ink btn-sm"
                onClick={() => setPage(currentPage + 1)}
              >
                Seterusnya
              </button>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}
