import Link from "next/link";
import EquipmentAdminForms from "@/components/peralatan/EquipmentAdminForms";
import { withDbTimeout } from "@/lib/db";
import {
  listEquipmentPkgs,
  listEquipmentTypeOptions,
} from "@/lib/peralatan/queries";
import { requireTempahanAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminEquipmentUnitsPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  await requireTempahanAccess(pkgId);

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
    const types = await withDbTimeout(listEquipmentTypeOptions());

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
              {pkg.name} · Urus unit
            </h1>
            <p className="mt-1 text-sm text-graphite">
              Daftar unit, import inventori dan kemas kini tetapan peralatan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/peralatan/${pkgId}/unit/senarai`}
              className="btn-ink btn-sm"
            >
              Senarai unit
            </Link>
            <Link
              href={`/admin/peralatan/${pkgId}/permohonan`}
              className="btn-outline-ink btn-sm"
            >
              Senarai permohonan
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <EquipmentAdminForms pkg={pkg} types={types} />
        </div>
      </>
    );
  } catch (error) {
    console.error("[peralatan] Gagal memuatkan pengurusan unit", error);
    return (
      <section className="card p-6">
        <h1 className="text-xl font-semibold text-ink">
          Pengurusan unit tidak dapat dimuatkan
        </h1>
        <p className="mt-2 text-sm text-graphite">
          Pangkalan data mengambil masa terlalu lama untuk bertindak balas. Sila
          cuba semula sebentar lagi.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`/admin/peralatan/${pkgId}/unit`}
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
