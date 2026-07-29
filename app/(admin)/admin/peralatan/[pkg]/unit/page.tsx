import Link from "next/link";
import EquipmentAdminForms from "@/components/peralatan/EquipmentAdminForms";
import { withDbTimeout } from "@/lib/db";
import {
  listEquipmentPkgs,
  listEquipmentTypeOptions,
  listEquipmentUnitsForPkg,
} from "@/lib/peralatan/queries";
import type { EquipmentUnitStatus } from "@/lib/peralatan/types";
import { requireTempahanAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<EquipmentUnitStatus>([
  "available",
  "reserved",
  "borrowed",
  "maintenance",
  "retired",
  "lost",
]);

export default async function AdminEquipmentUnitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string }>;
  searchParams: Promise<{
    cari?: string;
    status?: string;
    jenis?: string;
    page?: string;
  }>;
}) {
  const { pkg: pkgId } = await params;
  const query = await searchParams;
  await requireTempahanAccess(pkgId);

  const search = query.cari?.trim().slice(0, 200) ?? "";
  const status = VALID_STATUSES.has(query.status as EquipmentUnitStatus)
    ? (query.status as EquipmentUnitStatus)
    : undefined;
  const equipmentTypeId = query.jenis?.trim().slice(0, 80) ?? "";
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
    const types = await withDbTimeout(listEquipmentTypeOptions());
    const result = await withDbTimeout(
      listEquipmentUnitsForPkg(pkgId, {
        search,
        status,
        equipmentTypeId: equipmentTypeId || undefined,
        page,
      }),
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
              {pkg.name} · Senarai unit
            </h1>
            <p className="mt-1 text-sm text-graphite">
              Daftar, cari dan kemas kini inventori fizikal mengikut nombor siri.
            </p>
          </div>
          <Link
            href={`/admin/peralatan/${pkgId}/permohonan`}
            className="btn-outline-ink btn-sm"
          >
            Senarai permohonan
          </Link>
        </div>

        <div className="mt-8">
          <EquipmentAdminForms
            pkg={pkg}
            types={types}
            units={result.items}
            totalUnits={result.total}
            page={result.page}
            perPage={result.perPage}
            filters={{
              search,
              status: status ?? "",
              equipmentTypeId,
            }}
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("[peralatan] Gagal memuatkan senarai unit", error);
    return (
      <section className="card p-6">
        <h1 className="text-xl font-semibold text-ink">
          Senarai unit tidak dapat dimuatkan
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
