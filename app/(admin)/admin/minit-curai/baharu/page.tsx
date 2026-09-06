import { randomUUID } from "node:crypto";
import Link from "next/link";
import MinitCuraiForm from "@/components/minit-curai/MinitCuraiForm";
import { requireUser } from "@/lib/rbac";
import { listMinitCuraiReporters } from "@/lib/minit-curai/queries";

export const metadata = { title: "Tambah Minit Curai" };

export default async function NewMinitCuraiPage() {
  const user = await requireUser();
  const reporters = await listMinitCuraiReporters();
  return (
    <>
      <Link href="/admin/minit-curai" className="text-sm text-graphite hover:text-ink">← Minit Curai</Link>
      <h1 className="mt-3 text-2xl font-semibold">Tambah Minit Curai</h1>
      <p className="mt-1 text-sm text-graphite">Isi A, jana atau lengkapkan Kandungan di B, kemudian curai di C. Minit hanya kelihatan kepada staf.</p>
      <MinitCuraiForm
        id={randomUUID()}
        currentUser={{ nama: user.nama, jawatan: user.jawatan }}
        reporters={reporters}
      />
    </>
  );
}
