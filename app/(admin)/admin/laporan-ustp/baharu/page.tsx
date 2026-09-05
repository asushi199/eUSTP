import { randomUUID } from "node:crypto";
import Link from "next/link";
import UstpReportForm from "@/components/laporan-ustp/UstpReportForm";
import { listUstpPreparedByOptions } from "@/lib/laporan-ustp/queries";

export const maxDuration = 180;
export const metadata = { title: "Tambah Laporan Program USTP" };

export default async function NewUstpReportPage() {
  const responsibleByPkgCode = await listUstpPreparedByOptions();
  return <>
    <Link href="/admin/laporan-ustp" className="text-sm text-graphite hover:text-ink">← Laporan Program USTP</Link>
    <h1 className="mt-3 text-2xl font-semibold">Tambah Laporan Program USTP</h1>
    <UstpReportForm id={randomUUID()} responsibleByPkgCode={responsibleByPkgCode} />
  </>;
}
