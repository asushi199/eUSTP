import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEquipmentAdminSummary,
  listEquipmentPkgs,
} from "@/lib/peralatan/queries";
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

  let pkgs;
  let summary;
  try {
    pkgs = await withDbTimeout(listEquipmentPkgs());
    summary = await withDbTimeout(getEquipmentAdminSummary(pkgId));
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

  const pkg = pkgs.find((row) => row.id === pkgId);
  if (!pkg) notFound();

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
          ["Menunggu", summary.pendingCount],
          ["Ditempah", summary.reservedCount],
          ["Dipinjam", summary.borrowedCount],
          ["Penyelenggaraan", summary.maintenanceCount],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-graphite">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card flex flex-col justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-graphite">
              Operasi pinjaman
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink">
              Senarai permohonan
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-graphite">
              Tapis mengikut bulan, status, nama pemohon atau sekolah.
            </p>
          </div>
          <Link
            href={`/admin/peralatan/${pkgId}/permohonan`}
            className="btn-ink btn-sm mt-5 self-start"
          >
            Urus permohonan
          </Link>
        </div>
        <div className="card flex flex-col justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-graphite">
              Inventori fizikal
            </p>
            <h2 className="mt-2 text-lg font-semibold text-ink">
              Senarai unit
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-graphite">
              {summary.totalUnits.toLocaleString("ms-MY")} unit direkodkan. Cari
              nombor siri, kemas kini status atau import inventori.
            </p>
          </div>
          <Link
            href={`/admin/peralatan/${pkgId}/unit`}
            className="btn-outline-ink btn-sm mt-5 self-start"
          >
            Urus unit
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Permohonan terkini</h2>
            <p className="mt-1 text-sm text-graphite">
              Lima rekod terbaharu untuk semakan pantas.
            </p>
          </div>
          <Link
            href={`/admin/peralatan/${pkgId}/permohonan`}
            className="text-sm font-semibold text-charcoal hover:text-ink"
          >
            Lihat semua
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {summary.recentLoans.length === 0 ? (
            <div className="card p-6 text-sm text-graphite">
              Belum ada permohonan untuk {pkg.name}.
            </div>
          ) : (
            summary.recentLoans.map((loan) => (
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
    </>
  );
}
