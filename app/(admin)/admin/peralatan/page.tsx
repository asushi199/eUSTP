import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import {
  countPendingEquipmentLoansByPkg,
  listEquipmentPkgs,
} from "@/lib/peralatan/queries";

export const dynamic = "force-dynamic";

export default async function AdminPeralatanPage() {
  const user = await requireUser();
  try {
    const allPkgs = await listEquipmentPkgs();
    const visiblePkgs =
      user.peranan === "PKG_Admin"
        ? allPkgs.filter((pkg) => pkg.id === user.pkgId)
        : allPkgs;
    const pending = await countPendingEquipmentLoansByPkg(
      visiblePkgs.map((pkg) => pkg.id),
    );

    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Peminjaman Peralatan
            </h1>
            <p className="mt-1 text-sm text-graphite">
              Pilih PKG untuk mengurus permohonan, unit fizikal dan pegawai.
            </p>
          </div>
          <Link href="/tempahan/peralatan" className="btn-outline-ink btn-sm">
            Lihat katalog awam
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePkgs.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/admin/peralatan/${pkg.id}`}
              className="card relative p-5 transition hover:-translate-y-0.5 hover:shadow-modal"
            >
              {(pending[pkg.id] ?? 0) > 0 ? (
                <span
                  className="absolute right-3 top-3 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-bloom-deep px-2 text-xs font-bold leading-6 text-white"
                  aria-label={`${pending[pkg.id]} permohonan menunggu`}
                >
                  {pending[pkg.id]}
                </span>
              ) : null}
              <p className="font-semibold text-ink">{pkg.name}</p>
              <p className="mt-2 text-sm text-graphite">
                {pkg.managerName || "Pegawai belum ditetapkan"}
              </p>
              <p className="mt-1 text-xs text-graphite">
                {pending[pkg.id] ?? 0} permohonan menunggu
              </p>
            </Link>
          ))}
        </div>
      </>
    );
  } catch {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Peminjaman Peralatan
        </h1>
        <div className="card mt-6 p-6">
          <p className="font-semibold text-ink">Migrasi pangkalan data diperlukan</p>
          <p className="mt-2 text-sm leading-relaxed text-graphite">
            Jalankan migrasi <code>0011_equipment_loans</code> sebelum modul ini
            digunakan.
          </p>
        </div>
      </>
    );
  }
}
