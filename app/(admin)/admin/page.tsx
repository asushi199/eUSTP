import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan, canManageUsers } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await requireUser();

  const cards: { href: string; title: string; description: string }[] = [];

  if (canManageKandungan(user.peranan)) {
    cards.push(
      {
        href: "/admin/laporan-dpd",
        title: "Laporan DPD",
        description: "Semak dan urus laporan program pendigitalan.",
      },
      {
        href: "/admin/laporan-pss",
        title: "Laporan PSS",
        description: "Arkib bulanan dan statistik pelaporan PSS.",
      },
      {
        href: "/admin/direktori",
        title: "Direktori",
        description: "Sejarah versi, pemulihan dan eksport CSV.",
      },
    );
  }

  cards.push({
    href: "/admin/tempahan",
    title: "Tempahan PKG",
    description: "Kelulusan tempahan dan pengurusan bilik.",
  });

  if (canManageUsers(user.peranan)) {
    cards.push({
      href: "/admin/users",
      title: "Pengguna",
      description: "Urus akaun pentadbir dan pegawai.",
    });
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Selamat datang, {user.nama}
      </h1>
      <p className="mt-1 text-sm text-graphite">
        Pilih modul untuk diurus.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
