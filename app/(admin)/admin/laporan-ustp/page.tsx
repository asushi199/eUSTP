import Link from "next/link";
import UstpReportList from "@/components/laporan-ustp/UstpReportList";
import { requireUser } from "@/lib/rbac";
import { listUstpReports, resolveUstpMonth } from "@/lib/laporan-ustp/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan Program USTP" };

export default async function UstpReportsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const month = resolveUstpMonth(params.month);
  const reports = await listUstpReports(month);
  return <>
    <Link href="/laporan" className="text-sm text-graphite hover:text-ink">← CoE Reports</Link>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">Laporan Program USTP</h1><p className="mt-1 text-sm text-graphite">Rekod program mengikut bulan tarikh mula. Cari nama program, PKG atau penyedia — tapisan serta-merta.</p></div>
      <Link href="/admin/laporan-ustp/baharu" className="btn-primary">Tambah Laporan</Link>
    </div>
    <section className="mt-6" aria-label="Bulan laporan">
      <UstpReportList reports={reports} month={month} />
    </section>
  </>;
}
