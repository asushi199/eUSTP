import Link from "next/link";
import { withDbTimeout } from "@/lib/db";
import {
  listEquipmentLoansForPkg,
  listEquipmentPkgs,
} from "@/lib/peralatan/queries";
import { EQUIPMENT_LOAN_STATUS_LABEL } from "@/lib/peralatan/status";
import type {
  EquipmentLoanListItem,
  EquipmentLoanStatus,
} from "@/lib/peralatan/types";
import { requireTempahanAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<EquipmentLoanStatus>([
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "handed_over",
  "returned",
]);

function currentMonthInMalaysia() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

function LoanRow({
  pkgId,
  loan,
}: {
  pkgId: string;
  loan: EquipmentLoanListItem;
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
          {loan.applicantName} · {loan.totalQuantity} unit
        </p>
      </div>
      <div className="text-sm text-graphite sm:text-right">
        <p>
          {loan.borrowDate} → {loan.expectedReturnDate}
        </p>
        <p className="mt-1 text-xs">
          Dihantar{" "}
          {loan.createdAt.toLocaleDateString("ms-MY", {
            timeZone: "Asia/Kuala_Lumpur",
          })}
        </p>
      </div>
    </Link>
  );
}

export default async function AdminEquipmentApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string }>;
  searchParams: Promise<{
    bulan?: string;
    status?: string;
    cari?: string;
    page?: string;
  }>;
}) {
  const { pkg: pkgId } = await params;
  const query = await searchParams;
  await requireTempahanAccess(pkgId);

  const month =
    query.bulan === undefined
      ? currentMonthInMalaysia()
      : /^\d{4}-\d{2}$/.test(query.bulan)
        ? query.bulan
        : "";
  const status = VALID_STATUSES.has(query.status as EquipmentLoanStatus)
    ? (query.status as EquipmentLoanStatus)
    : undefined;
  const search = query.cari?.trim().slice(0, 200) ?? "";
  const page = Math.max(1, Number(query.page) || 1);

  try {
    const pkgs = await withDbTimeout(listEquipmentPkgs());
    const pkg = pkgs.find((row) => row.id === pkgId);
    if (!pkg) {
      return (
        <section className="card p-6">
          <h1 className="text-xl font-semibold text-ink">
            PKG tidak dijumpai
          </h1>
          <Link href="/admin/peralatan" className="btn-outline-ink btn-sm mt-5">
            Kembali ke semua PKG
          </Link>
        </section>
      );
    }
    const result = await withDbTimeout(
      listEquipmentLoansForPkg(pkgId, {
        month: month || undefined,
        status,
        search,
        page,
      }),
    );
    const pending =
      status === "pending"
        ? { items: [], total: 0 }
        : await withDbTimeout(
            listEquipmentLoansForPkg(pkgId, {
              status: "pending",
              page: 1,
              perPage: 5,
            }),
          );
    const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

    function pageHref(nextPage: number) {
      const values = new URLSearchParams();
      values.set("bulan", month);
      if (status) values.set("status", status);
      if (search) values.set("cari", search);
      if (nextPage > 1) values.set("page", String(nextPage));
      return `/admin/peralatan/${pkgId}/permohonan?${values.toString()}`;
    }

    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/admin/peralatan/${pkgId}`}
              className="text-sm text-graphite hover:text-ink"
            >
              ← Ringkasan peralatan
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {pkg.name} · Senarai permohonan
            </h1>
            <p className="mt-1 text-sm text-graphite">
              Semak tindakan segera dan cari rekod mengikut bulan pinjaman.
            </p>
          </div>
          <Link
            href={`/admin/peralatan/${pkgId}/unit/senarai`}
            className="btn-outline-ink btn-sm"
          >
            Senarai unit
          </Link>
        </div>

        {pending.items.length > 0 ? (
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
              <Link
                href={`/admin/peralatan/${pkgId}/permohonan?bulan=&status=pending`}
                className="text-sm font-semibold text-charcoal hover:text-ink"
              >
                Lihat semua ({pending.total})
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {pending.items.map((loan) => (
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
                Bulan merujuk kepada tarikh pinjaman yang dipohon.
              </p>
            </div>
            <form
              method="get"
              className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_210px_minmax(220px,1fr)_auto]"
            >
              <div>
                <label className="label" htmlFor="loan-month">
                  Bulan pinjaman
                </label>
                <input
                  id="loan-month"
                  name="bulan"
                  type="month"
                  className="input"
                  defaultValue={month}
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
                  defaultValue={status ?? ""}
                >
                  <option value="">Semua status</option>
                  {(
                    Object.entries(EQUIPMENT_LOAN_STATUS_LABEL) as Array<
                      [EquipmentLoanStatus, string]
                    >
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="loan-search">
                  Cari
                </label>
                <input
                  id="loan-search"
                  name="cari"
                  className="input"
                  defaultValue={search}
                  placeholder="No. rujukan, nama atau sekolah"
                />
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <button type="submit" className="btn-ink btn-sm">
                  Tapis
                </button>
                <Link
                  href={`/admin/peralatan/${pkgId}/permohonan?bulan=`}
                  className="btn-outline-ink btn-sm"
                >
                  Semua bulan
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">
              Senarai mengikut tapisan
            </h2>
            <span className="text-sm font-semibold tabular-nums text-charcoal">
              {result.total.toLocaleString("ms-MY")} permohonan
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {result.items.length === 0 ? (
              <div className="card p-6 text-sm text-graphite">
                Tiada permohonan sepadan. Ubah bulan, status atau kata carian.
              </div>
            ) : (
              result.items.map((loan) => (
                <LoanRow key={loan.id} pkgId={pkgId} loan={loan} />
              ))
            )}
          </div>

          {totalPages > 1 ? (
            <nav
              className="mt-5 flex items-center justify-between text-sm"
              aria-label="Muka surat senarai permohonan"
            >
              {result.page > 1 ? (
                <Link
                  href={pageHref(result.page - 1)}
                  className="btn-outline-ink btn-sm"
                >
                  Sebelum
                </Link>
              ) : (
                <span />
              )}
              <span className="text-graphite">
                Muka {result.page} / {totalPages}
              </span>
              {result.page < totalPages ? (
                <Link
                  href={pageHref(result.page + 1)}
                  className="btn-outline-ink btn-sm"
                >
                  Seterusnya
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      </>
    );
  } catch (error) {
    console.error("[peralatan] Gagal memuatkan senarai permohonan", error);
    return (
      <section className="card p-6">
        <h1 className="text-xl font-semibold text-ink">
          Senarai permohonan tidak dapat dimuatkan
        </h1>
        <p className="mt-2 text-sm text-graphite">
          Pangkalan data mengambil masa terlalu lama untuk bertindak balas. Sila
          cuba semula sebentar lagi.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`/admin/peralatan/${pkgId}/permohonan`}
            className="btn-primary btn-sm"
          >
            Cuba semula
          </a>
          <Link
            href={`/admin/peralatan/${pkgId}`}
            className="btn-outline-ink btn-sm"
          >
            Kembali
          </Link>
        </div>
      </section>
    );
  }
}
