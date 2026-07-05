import Link from "next/link";
import AdminSchoolsTable from "@/components/direktori/AdminSchoolsTable";
import ExportGuruMenu from "@/components/direktori/ExportGuruMenu";
import TambahSekolahForm from "@/components/direktori/TambahSekolahForm";
import { requireKandunganAccess } from "@/lib/rbac";
import { listAdminSchools } from "@/lib/direktori/queries";

export const dynamic = "force-dynamic";

export default async function AdminDirektoriPage() {
  await requireKandunganAccess();
  const records = await listAdminSchools();

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Direktori — Admin</h1>
          <p className="mt-1 text-sm text-graphite">
            {records.length} sekolah · versi semasa dipaparkan
          </p>
        </div>
        <div className="flex gap-2">
          <ExportGuruMenu />
          <Link
            href="/admin/direktori/export?listType=schools"
            className="btn-outline-ink btn-sm"
            prefetch={false}
          >
            CSV Sekolah
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <AdminSchoolsTable records={records} />
      </div>

      <div className="mt-8 max-w-xl">
        <TambahSekolahForm />
      </div>
    </>
  );
}
