"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ADMIN_LOAN_PAGE_SIZE,
  EQUIPMENT_LOAN_WORKFLOW_ORDER,
  equipmentLoanListHref,
  filterEquipmentLoans,
  type EquipmentLoanListRow,
} from "@/lib/peralatan/loan-list";
import { EQUIPMENT_LOAN_STATUS_LABEL } from "@/lib/peralatan/status";
import type { EquipmentLoanStatus } from "@/lib/peralatan/types";

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
  pendingLoans,
  pendingTotal,
  month: selectedMonth,
  status: selectedStatus,
  search: selectedSearch,
  total,
  page,
  totalPages,
}: {
  pkgId: string;
  loans: EquipmentLoanListRow[];
  pendingLoans: EquipmentLoanListRow[];
  pendingTotal: number;
  month: string;
  status: EquipmentLoanStatus | "";
  search: string;
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const scopedToMonth = Boolean(selectedMonth);
  const [status, setStatus] = useState<EquipmentLoanStatus | "">(selectedStatus);
  const [search, setSearch] = useState(selectedSearch);

  useEffect(() => {
    setStatus(selectedStatus);
    setSearch(selectedSearch);
  }, [selectedMonth, selectedStatus, selectedSearch]);

  const filtered = useMemo(
    () =>
      scopedToMonth
        ? filterEquipmentLoans(loans, { status, search })
        : loans,
    [loans, scopedToMonth, status, search],
  );
  const [clientPage, setClientPage] = useState(1);
  const clientTotalPages = Math.max(
    1,
    Math.ceil(filtered.length / ADMIN_LOAN_PAGE_SIZE),
  );
  const safeClientPage = Math.min(clientPage, clientTotalPages);
  const pageItems = scopedToMonth
    ? filtered.slice(
        (safeClientPage - 1) * ADMIN_LOAN_PAGE_SIZE,
        safeClientPage * ADMIN_LOAN_PAGE_SIZE,
      )
    : loans;
  const visibleTotal = scopedToMonth ? filtered.length : total;
  const showPendingQueue = !status && pendingLoans.length > 0;

  useEffect(() => {
    setClientPage(1);
  }, [status, search, selectedMonth]);

  useEffect(() => {
    if (scopedToMonth) return;
    const handle = window.setTimeout(() => {
      if (search.trim() === selectedSearch.trim()) return;
      startTransition(() => {
        router.replace(
          equipmentLoanListHref(pkgId, {
            month: "",
            status,
            search,
            page: 1,
          }),
          { scroll: false },
        );
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [pkgId, router, scopedToMonth, search, selectedSearch, status]);

  function href(next: {
    month?: string;
    status?: EquipmentLoanStatus | "";
    search?: string;
    page?: number;
  }) {
    return equipmentLoanListHref(pkgId, {
      month: next.month ?? selectedMonth,
      status: next.status ?? status,
      search: next.search ?? search,
      page: next.page,
    });
  }

  function replaceUrl(
    nextMonth: string,
    nextStatus: EquipmentLoanStatus | "",
    nextSearch: string,
  ) {
    window.history.replaceState(null, "", href({
      month: nextMonth,
      status: nextStatus,
      search: nextSearch,
    }));
  }

  function navigate(next: {
    month?: string;
    status?: EquipmentLoanStatus | "";
    search?: string;
    page?: number;
  }) {
    startTransition(() => {
      router.replace(href(next), { scroll: false });
    });
  }

  function changeMonth(nextMonth: string) {
    navigate({ month: nextMonth, status, search, page: 1 });
  }

  function changeStatus(nextStatus: EquipmentLoanStatus | "") {
    if (scopedToMonth) {
      setStatus(nextStatus);
      replaceUrl(selectedMonth, nextStatus, search);
      return;
    }
    navigate({ month: "", status: nextStatus, search, page: 1 });
  }

  function changeSearch(nextSearch: string) {
    setSearch(nextSearch);
    if (scopedToMonth) {
      replaceUrl(selectedMonth, status, nextSearch);
    }
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
              onClick={() =>
                navigate({
                  month: "",
                  status: "pending",
                  search: "",
                  page: 1,
                })
              }
            >
              Lihat semua ({pendingTotal})
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {pendingLoans.map((loan) => (
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
              {scopedToMonth
                ? "Status dan carian dalam bulan ini digunakan serta-merta. Menukar bulan memuatkan semula rekod bulan itu sahaja."
                : "Semua bulan dimuatkan 25 rekod setiap muka surat. Status dan carian menapis di pelayan tanpa butang Tapis."}
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="loan-month">
                Bulan pinjaman
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="loan-month"
                  name="bulan"
                  type="month"
                  className="input min-w-0 flex-1"
                  value={selectedMonth}
                  onChange={(event) => changeMonth(event.target.value)}
                />
                <button
                  type="button"
                  className="btn-outline-ink shrink-0 whitespace-nowrap px-4 text-xs"
                  onClick={() => changeMonth("")}
                  disabled={!selectedMonth}
                >
                  Semua bulan
                </button>
              </div>
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
            <div className="sm:col-span-2 lg:col-span-1">
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
                {visibleTotal.toLocaleString("ms-MY")} permohonan sepadan
              </p>
            </div>
          </div>
        </div>

        <div
          className={`mt-5 ${isPending ? "pointer-events-none opacity-60" : ""}`}
          aria-busy={isPending}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">
              Senarai mengikut tapisan
            </h2>
            <span className="text-sm font-semibold tabular-nums text-charcoal">
              {visibleTotal.toLocaleString("ms-MY")} permohonan
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

          {scopedToMonth && clientTotalPages > 1 ? (
            <nav
              className="mt-5 flex items-center justify-between text-sm"
              aria-label="Muka surat senarai permohonan"
            >
              {safeClientPage > 1 ? (
                <button
                  type="button"
                  className="btn-outline-ink btn-sm"
                  onClick={() => setClientPage(safeClientPage - 1)}
                >
                  Sebelum
                </button>
              ) : (
                <span />
              )}
              <span className="text-graphite">
                Muka {safeClientPage} / {clientTotalPages}
              </span>
              {safeClientPage < clientTotalPages ? (
                <button
                  type="button"
                  className="btn-outline-ink btn-sm"
                  onClick={() => setClientPage(safeClientPage + 1)}
                >
                  Seterusnya
                </button>
              ) : (
                <span />
              )}
            </nav>
          ) : null}

          {!scopedToMonth && totalPages > 1 ? (
            <nav
              className="mt-5 flex items-center justify-between text-sm"
              aria-label="Muka surat senarai permohonan"
            >
              {page > 1 ? (
                <Link
                  href={href({ month: "", page: page - 1 })}
                  className="btn-outline-ink btn-sm"
                  scroll={false}
                >
                  Sebelum
                </Link>
              ) : (
                <span />
              )}
              <span className="text-graphite">
                Muka {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={href({ month: "", page: page + 1 })}
                  className="btn-outline-ink btn-sm"
                  scroll={false}
                >
                  Seterusnya
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </div>
      </section>
    </>
  );
}
