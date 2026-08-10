import Link from "next/link";
import { notFound } from "next/navigation";
import AdminLoanApproval from "@/components/peralatan/AdminLoanApproval";
import { withDbTimeout } from "@/lib/db";
import { getEquipmentLoanDetail } from "@/lib/peralatan/queries";
import { requireTempahanAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function AdminEquipmentLoanPage({
  params,
}: {
  params: Promise<{ pkg: string; id: string }>;
}) {
  const { pkg: pkgId, id } = await params;
  await requireTempahanAccess(pkgId);
  let request;
  try {
    request = await withDbTimeout(getEquipmentLoanDetail(pkgId, id));
  } catch (error) {
    console.error("[peralatan] Gagal memuatkan butiran permohonan", error);
    return (
      <section className="card p-6">
        <h1 className="text-xl font-semibold text-ink">
          Butiran permohonan tidak dapat dimuatkan
        </h1>
        <p className="mt-2 text-sm text-graphite">
          Pangkalan data mengambil masa terlalu lama untuk bertindak balas. Sila
          cuba semula sebentar lagi.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`/admin/peralatan/${pkgId}/permohonan/${id}`}
            className="btn-primary btn-sm"
          >
            Cuba semula
          </a>
          <Link
            href={`/admin/peralatan/${pkgId}/permohonan`}
            className="btn-outline-ink btn-sm"
          >
            Kembali ke senarai
          </Link>
        </div>
      </section>
    );
  }
  if (!request) notFound();

  return (
    <>
      <Link
        href={`/admin/peralatan/${pkgId}/permohonan`}
        className="text-sm text-graphite hover:text-ink"
      >
        ← Senarai permohonan
      </Link>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        Pinjaman & KEW.PA-9
      </h1>
      <p className="mt-1 text-sm text-graphite">
        Urus kelulusan, serahan, pemulangan dan dokumen rasmi.
      </p>
      <AdminLoanApproval pkgId={pkgId} request={request} />
    </>
  );
}
