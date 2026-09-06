import { randomUUID } from "node:crypto";
import Link from "next/link";
import MinitCuraiForm from "@/components/minit-curai/MinitCuraiForm";
import { requireUser } from "@/lib/rbac";
import { listMinitCuraiOfficers } from "@/lib/minit-curai/queries";

export const metadata = { title: "Tambah Minit Curai" };

export default async function NewMinitCuraiPage() {
  const user = await requireUser();
  const officers = await listMinitCuraiOfficers();
  return (
    <>
      <Link href="/admin/minit-curai" className="text-sm text-graphite hover:text-ink">← Minit Curai</Link>
      <h1 className="mt-3 text-2xl font-semibold">Tambah Minit Curai</h1>
      <p className="mt-1 text-sm text-graphite">Isi peringkat A, kemudian B dan C. Minit hanya kelihatan kepada staf.</p>
      <MinitCuraiForm
        id={randomUUID()}
        currentUser={{ nama: user.nama, jawatan: user.jawatan }}
        officers={officers}
      />
    </>
  );
}
