import Link from "next/link";
import { notFound } from "next/navigation";
import MinitCuraiForm from "@/components/minit-curai/MinitCuraiForm";
import { requireUser } from "@/lib/rbac";
import { getMinitCurai, listMinitCuraiReporters } from "@/lib/minit-curai/queries";

export const metadata = { title: "Edit Minit Curai" };

export default async function EditMinitCuraiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [report, reporters] = await Promise.all([getMinitCurai(id), listMinitCuraiReporters()]);
  if (!report) notFound();
  return (
    <>
      <Link href={`/admin/minit-curai/${id}`} className="text-sm text-graphite hover:text-ink">← Minit Curai</Link>
      <h1 className="mt-3 text-2xl font-semibold">Edit Minit Curai</h1>
      <MinitCuraiForm
        id={id}
        currentUser={{ nama: user.nama, jawatan: user.jawatan }}
        reporters={reporters}
        report={report}
      />
    </>
  );
}
