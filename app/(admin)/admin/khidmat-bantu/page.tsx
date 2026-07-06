import Link from "next/link";
import KhidmatBantuAdminView from "@/components/khidmat-bantu/KhidmatBantuAdminView";
import { listAdminKhidmatBantuRequests } from "@/lib/khidmat-bantu/queries";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminKhidmatBantuPage() {
  await requireKandunganAccess();
  const { pending, others, dbNotReady } = await listAdminKhidmatBantuRequests();

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin" className="text-sm text-graphite hover:text-ink">
            ← Admin
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Permohonan Khidmat Bantu
          </h1>
        </div>
        <Link href="/admin/khidmat-bantu/tetapan" className="btn-outline-ink btn-sm">
          Tetapan WhatsApp
        </Link>
      </div>

      {dbNotReady ? (
        <div className="card mt-6 border-amber-200 bg-amber-50/80 p-6 text-sm leading-relaxed text-graphite">
          <p className="font-semibold text-ink">Jadual pangkalan data belum sedia</p>
          <p className="mt-2">
            Modul Khidmat Bantu memerlukan migrasi <code className="text-xs">0006_khidmat_bantu</code>.
            Jalankan <code className="text-xs">npm run db:migrate</code> pada pangkalan data
            production (Supabase / Vercel Postgres), kemudian muat semula halaman ini.
          </p>
        </div>
      ) : (
        <KhidmatBantuAdminView pending={pending} others={others} />
      )}
    </>
  );
}
