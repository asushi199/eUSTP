import Link from "next/link";
import { notFound } from "next/navigation";
import EquipmentAdminForms from "@/components/peralatan/EquipmentAdminForms";
import {
  listEquipmentCatalog,
  listEquipmentLoansForPkg,
  listEquipmentPkgs,
  listEquipmentUnitsForPkg,
} from "@/lib/peralatan/queries";
import { loadEquipmentAdminPageData } from "@/lib/peralatan/admin-page-data";
import { withDbTimeout } from "@/lib/db";
import { EQUIPMENT_LOAN_STATUS_LABEL } from "@/lib/peralatan/status";
import { requireTempahanAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminPkgPeralatanPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  await requireTempahanAccess(pkgId);

  let pageData;
  try {
    pageData = await loadEquipmentAdminPageData(pkgId, {
      listPkgs: listEquipmentPkgs,
      listCatalog: () => listEquipmentCatalog(true),
      listUnits: listEquipmentUnitsForPkg,
      listLoans: listEquipmentLoansForPkg,
    }, withDbTimeout);
  } catch (error) {
    console.error("[peralatan] Gagal memuatkan data admin", error);
    return (
      <section className="card p-6">
        <h1 className="text-xl font-semibold text-ink">Peralatan tidak dapat dimuatkan</h1>
        <p className="mt-2 text-sm text-graphite">
          Pangkalan data mengambil masa terlalu lama untuk bertindak balas. Sila muat
          semula halaman sebentar lagi.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={`/admin/peralatan/${pkgId}`} className="btn-primary btn-sm">
            Cuba semula
          </a>
          <Link href="/admin/peralatan" className="btn-outline-ink btn-sm">
            Semua PKG
          </Link>
        </div>
      </section>
    );
  }

  const { pkgs, catalog, units, loans } = pageData;
  const pkg = pkgs.find((row) => row.id === pkgId);
  if (!pkg) notFound();

  const pendingCount = loans.filter((loan) => loan.status === "pending").length;
  const reservedCount = units.filter((unit) => unit.status === "reserved").length;
  const borrowedCount = units.filter((unit) => unit.status === "borrowed").length;
  const maintenanceCount = units.filter(
    (unit) => unit.status === "maintenance",
  ).length;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/peralatan" className="text-sm text-graphite hover:text-ink">
            ← Semua PKG
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            {pkg.name} · Peralatan
          </h1>
          <p className="mt-1 text-sm text-graphite">
            Rekod inventori fizikal dan urus permohonan pinjaman.
          </p>
        </div>
        <Link href="/tempahan/peralatan" className="btn-outline-ink btn-sm">
          Katalog awam
        </Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Menunggu", pendingCount],
          ["Ditempah", reservedCount],
          ["Dipinjam", borrowedCount],
          ["Penyelenggaraan", maintenanceCount],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-graphite">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <div>
          <h2 className="text-lg font-semibold text-ink">Permohonan pinjaman</h2>
          <p className="mt-1 text-sm text-graphite">
            Permohonan baharu dipaparkan dahulu untuk tindakan.
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {loans.length === 0 ? (
            <div className="card p-6 text-sm text-graphite">
              Belum ada permohonan untuk {pkg.name}.
            </div>
          ) : (
            loans.map((loan) => (
              <Link
                key={loan.id}
                href={`/admin/peralatan/${pkgId}/permohonan/${loan.id}`}
                className="card grid gap-3 p-4 transition hover:shadow-modal sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {loan.referenceNo}
                    </span>
                    <span className="status-badge">
                      <span
                        className={`status-dot ${
                          loan.status === "pending"
                            ? "bg-amber-400"
                            : loan.status === "approved"
                              ? "bg-primary"
                              : "bg-graphite"
                        }`}
                      />
                      {EQUIPMENT_LOAN_STATUS_LABEL[loan.status]}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{loan.orgName}</p>
                  <p className="mt-1 text-sm text-graphite">
                    {loan.applicantName} · {loan.totalQuantity} unit
                  </p>
                </div>
                <p className="text-sm text-graphite">
                  {loan.borrowDate} → {loan.expectedReturnDate}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>

      <div className="mt-10 border-t border-fog pt-8">
        <EquipmentAdminForms
          pkg={pkg}
          types={catalog.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
          }))}
          units={units}
        />
      </div>
    </>
  );
}
