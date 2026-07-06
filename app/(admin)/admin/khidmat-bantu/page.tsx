import Link from "next/link";
import KhidmatBantuAdminView from "@/components/khidmat-bantu/KhidmatBantuAdminView";
import { loadKhidmatBantuAdmin } from "@/lib/khidmat-bantu/queries";
import { requireKandunganAccess } from "@/lib/rbac";
import { parseBulan, todayParts } from "@/lib/month-view";

export const dynamic = "force-dynamic";

export default async function AdminKhidmatBantuPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; view?: string }>;
}) {
  await requireKandunganAccess();
  const { bulan, view } = await searchParams;
  const { year, month } = parseBulan(bulan) ?? todayParts();
  const { pending, monthRows, dbNotReady } = await loadKhidmatBantuAdmin(year, month);

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
            Modul Khidmat Bantu memerlukan migrasi terkini (termasuk lajur{" "}
            <code className="text-xs">activity_date</code>). Jalankan{" "}
            <code className="text-xs">npm run db:migrate</code> pada pangkalan data
            production (Supabase / Vercel Postgres), kemudian muat semula halaman ini.
          </p>
        </div>
      ) : (
        <KhidmatBantuAdminView
          pending={pending}
          monthRows={monthRows}
          year={year}
          month={month}
          initialView={view === "senarai" ? "senarai" : "kalendar"}
        />
      )}
    </>
  );
}
