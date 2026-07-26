import Link from "next/link";
import { notFound } from "next/navigation";
import AdminLoanApproval from "@/components/peralatan/AdminLoanApproval";
import { getEquipmentLoanDetail } from "@/lib/peralatan/queries";
import { requireTempahanAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminEquipmentLoanPage({
  params,
}: {
  params: Promise<{ pkg: string; id: string }>;
}) {
  const { pkg: pkgId, id } = await params;
  await requireTempahanAccess(pkgId);
  const request = await getEquipmentLoanDetail(pkgId, id);
  if (!request) notFound();

  return (
    <>
      <Link
        href={`/admin/peralatan/${pkgId}`}
        className="text-sm text-graphite hover:text-ink"
      >
        ← Senarai permohonan
      </Link>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
        Kelulusan Pinjaman
      </h1>
      <p className="mt-1 text-sm text-graphite">
        Semak permohonan dan tetapkan unit sebenar berdasarkan nombor siri.
      </p>
      <AdminLoanApproval pkgId={pkgId} request={request} />
    </>
  );
}
