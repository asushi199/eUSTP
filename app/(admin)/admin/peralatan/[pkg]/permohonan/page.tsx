import Link from "next/link";
import AdminLoanList from "@/components/peralatan/AdminLoanList";
import { withDbTimeout } from "@/lib/db";
import {
  currentMonthInMalaysia,
  serializeEquipmentLoanListItem,
} from "@/lib/peralatan/loan-list";
import {
  listEquipmentLoansForPkg,
  listEquipmentPkgs,
} from "@/lib/peralatan/queries";
import type { EquipmentLoanStatus } from "@/lib/peralatan/types";
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

export default async function AdminEquipmentApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string }>;
  searchParams: Promise<{
    bulan?: string;
    status?: string;
    cari?: string;
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
    : "";
  const search = query.cari?.trim().slice(0, 200) ?? "";

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
      listEquipmentLoansForPkg(pkgId, { all: true }),
    );

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

        <AdminLoanList
          pkgId={pkgId}
          loans={result.items.map(serializeEquipmentLoanListItem)}
          initialMonth={month}
          initialStatus={status}
          initialSearch={search}
        />
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
