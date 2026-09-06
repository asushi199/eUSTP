import Link from "next/link";
import MinitCuraiList from "@/components/minit-curai/MinitCuraiList";
import { requireUser } from "@/lib/rbac";
import { listMinitCurai, resolveMinitMonth } from "@/lib/minit-curai/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Minit Curai" };

export default async function MinitCuraiPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const month = resolveMinitMonth(params.month);
  const reports = await listMinitCurai(month);
  return (
    <>
      <Link href="/laporan" className="text-sm text-graphite hover:text-ink">← CoE Reports</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Minit Curai</h1>
          <p className="mt-1 text-sm text-graphite">
            Rekod taklimat, mesyuarat, kursus atau bengkel selepas pegawai pulang. Cari tajuk, pelapor atau unit — tapisan serta-merta.
          </p>
        </div>
        <Link href="/admin/minit-curai/baharu" className="btn-primary">Tambah Minit</Link>
      </div>
      <section className="mt-6" aria-label="Bulan minit curai">
        <MinitCuraiList reports={reports} month={month} />
      </section>
    </>
  );
}
