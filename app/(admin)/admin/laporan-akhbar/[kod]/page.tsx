import Link from "next/link";
import { notFound } from "next/navigation";
import AdminAkhbarForm from "@/components/laporan-akhbar/AdminAkhbarForm";
import { requireKandunganAccess } from "@/lib/rbac";
import {
  getLaporanAkhbarBySchool,
  getSchoolByCode,
} from "@/lib/laporan-akhbar/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ kod: string }>;
};

export default async function AdminLaporanAkhbarDetailPage({ params }: Props) {
  await requireKandunganAccess();
  const { kod: raw } = await params;
  const kod = decodeURIComponent(raw).trim().toUpperCase();
  const school = await getSchoolByCode(kod);
  if (!school) notFound();
  const record = await getLaporanAkhbarBySchool(kod);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-graphite">
            <Link href="/admin/laporan-akhbar" className="hover:text-ink">
              ← Senarai Laporan Akhbar
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Semakan — {school.code}
          </h1>
        </div>
      </div>
      <AdminAkhbarForm
        schoolCode={school.code}
        schoolName={school.name}
        record={record}
      />
    </>
  );
}
