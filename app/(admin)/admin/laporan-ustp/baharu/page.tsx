import { randomUUID } from "node:crypto";
import Link from "next/link";
import UstpReportForm from "@/components/laporan-ustp/UstpReportForm";
import { requireUser } from "@/lib/rbac";

export const maxDuration = 180;
export const metadata = { title: "Tambah Laporan Program USTP" };

export default async function NewUstpReportPage() {
  const user = await requireUser();
  return <>
    <Link href="/admin/laporan-ustp" className="text-sm text-graphite hover:text-ink">← Laporan Program USTP</Link>
    <h1 className="mt-3 text-2xl font-semibold">Tambah Laporan Program USTP</h1>
    <UstpReportForm id={randomUUID()} preparedBy={user.nama ?? ""} />
  </>;
}
