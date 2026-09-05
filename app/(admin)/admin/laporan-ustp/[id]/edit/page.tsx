import Link from "next/link";
import { notFound } from "next/navigation";
import UstpReportForm from "@/components/laporan-ustp/UstpReportForm";
import { getUstpReport, listUstpPreparedByOptions } from "@/lib/laporan-ustp/queries";

export const maxDuration = 180;
export const metadata = { title: "Edit Laporan Program USTP" };

export default async function EditUstpReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [report, responsibleByPkgCode] = await Promise.all([
    getUstpReport(id),
    listUstpPreparedByOptions(),
  ]);
  if (!report) notFound();
  return <>
    <Link href={`/admin/laporan-ustp/${id}`} className="text-sm text-graphite hover:text-ink">← Laporan Program USTP</Link>
    <h1 className="mt-3 text-2xl font-semibold">Edit Laporan Program USTP</h1>
    <UstpReportForm id={id} responsibleByPkgCode={responsibleByPkgCode} report={report} />
  </>;
}
