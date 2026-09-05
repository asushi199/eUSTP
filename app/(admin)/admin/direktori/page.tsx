import Link from "next/link";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type AdminCard = { href: string; title: string; description: string };

export default async function AdminDirektoriHubPage() {
  await requireKandunganAccess();
  const cards: AdminCard[] = [
    {
      href: "/admin/direktori/sekolah",
      title: "Direktori Sekolah",
      description: "Maklumat perhubungan sekolah, sejarah versi dan eksport CSV.",
    },
    {
      href: "/admin/direktori/pegawai",
      title: "Pegawai USTP",
      description: "Senarai pegawai untuk Direktori USTP.",
    },
    {
      href: "/admin/direktori/tetapan",
      title: "Tetapan USTP",
      description: "Carta organisasi, imej PKG dan takwim Direktori USTP.",
    },
  ];

  return (
    <>
      <Link href="/admin" className="text-sm text-graphite hover:text-ink">
        ← Papan Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">CoE Directory</h1>
      <p className="mt-1 text-sm text-graphite">
        Urus Direktori Sekolah dan Direktori USTP.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="card p-5 transition hover:-translate-y-0.5 hover:shadow-modal"
          >
            <p className="font-semibold">{c.title}</p>
            <p className="mt-1 text-sm text-graphite">{c.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
