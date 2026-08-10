import Link from "next/link";
import { notFound } from "next/navigation";
import { withDbTimeout } from "@/lib/db";
import {
  listEquipmentPkgs,
  listEquipmentTransferBatchesForPkg,
} from "@/lib/peralatan/queries";
import { requireTempahanAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminEquipmentTransferHistoryPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  const user = await requireTempahanAccess(pkgId);
  if (user.peranan === "PKG_Admin") {
    return (
      <section className="card p-6">
        <h1 className="text-xl font-semibold text-ink">Akses tidak dibenarkan</h1>
        <p className="mt-2 text-sm leading-relaxed text-graphite">
          Rekod pindahan aset hanya boleh disemak oleh pentadbir utama.
        </p>
      </section>
    );
  }

  try {
    const [pkgs, transfers] = await Promise.all([
      withDbTimeout(listEquipmentPkgs()),
      withDbTimeout(listEquipmentTransferBatchesForPkg(pkgId)),
    ]);
    const pkg = pkgs.find((item) => item.id === pkgId);
    if (!pkg) notFound();

    return (
      <>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/admin/peralatan/${pkgId}/unit/senarai`}
              className="text-sm text-graphite hover:text-ink"
            >
              ← Senarai unit
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {pkg.name} · Rekod pindahan
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-graphite">
              Semak pindahan yang melibatkan PKG ini dan muat turun semula
              KEW.PA-17.
            </p>
          </div>
          <Link
            href={`/admin/peralatan/${pkgId}/unit/senarai`}
            className="btn-outline-ink btn-sm"
          >
            Urus unit
          </Link>
        </div>

        <section className="mt-8 space-y-3">
          {transfers.length === 0 ? (
            <div className="card p-6">
              <h2 className="font-semibold text-ink">Belum ada rekod pindahan</h2>
              <p className="mt-1 text-sm leading-relaxed text-graphite">
                Pindahan baharu akan direkodkan di sini bersama pautan muat
                turun KEW.PA-17.
              </p>
            </div>
          ) : (
            transfers.map((transfer) => (
              <article
                key={transfer.id}
                className="card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-primary">
                    {transfer.referenceNo}
                  </p>
                  <p className="mt-2 font-semibold text-ink">
                    {transfer.fromPkgName} → {transfer.toPkgName}
                  </p>
                  <p className="mt-1 text-sm text-graphite">
                    {transfer.totalUnits.toLocaleString("ms-MY")} unit · {" "}
                    {transfer.movedAt.toLocaleDateString("ms-MY", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {transfer.notes ? (
                    <p className="mt-2 text-sm leading-relaxed text-graphite">
                      {transfer.notes}
                    </p>
                  ) : null}
                </div>
                <a
                  href={`/admin/peralatan/${transfer.fromPkgId}/pindahan/${transfer.id}/kew-pa-17`}
                  className="btn-ink btn-sm self-start sm:self-center"
                >
                  Muat turun KEW.PA-17
                </a>
              </article>
            ))
          )}
        </section>
      </>
    );
  } catch (error) {
    console.error("[peralatan] Gagal memuatkan rekod pindahan", error);
    return (
      <section className="card p-6">
        <h1 className="text-xl font-semibold text-ink">
          Rekod pindahan tidak dapat dimuatkan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-graphite">
          Pangkalan data mengambil masa terlalu lama untuk bertindak balas.
          Sila cuba semula sebentar lagi.
        </p>
        <a
          href={`/admin/peralatan/${pkgId}/pindahan`}
          className="btn-primary btn-sm mt-5"
        >
          Cuba semula
        </a>
      </section>
    );
  }
}
