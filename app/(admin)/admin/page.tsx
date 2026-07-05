import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan, canManageUsers } from "@/lib/roles";

export const dynamic = "force-dynamic";

type AdminCard = { href: string; title: string; description: string };
type AdminGroup = { heading: string; blurb?: string; cards: AdminCard[] };

export default async function AdminOverviewPage() {
  const user = await requireUser();
  const urusKandungan = canManageKandungan(user.peranan);

  const groups: AdminGroup[] = [];

  if (urusKandungan) {
    groups.push({
      heading: "Pelaporan",
      cards: [
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
      ],
    });

    groups.push({
      heading: "OSC One Stop Center",
      blurb: "Kandungan halaman awam /osc — sumber, analisis dan maklumat asas.",
      cards: [
        {
          href: "/admin/kandungan",
          title: "Sumber USTP",
          description: "Kad bahan — kertas kerja, laporan dan hebahan untuk /sumber.",
        },
        {
          href: "/admin/analisis",
          title: "Analisis USTP",
          description: "Nombor DELIMa, DCS, Ains, Pensijilan dan OPTIK.",
        },
        {
          href: "/admin/pegawai",
          title: "Pegawai USTP",
          description: "Senarai pegawai halaman Maklumat Asas.",
        },
        {
          href: "/admin/tetapan",
          title: "Tetapan Maklumat Asas",
          description: "Carta organisasi, imej PKG dan takwim.",
        },
      ],
    });
  }

  const perkhidmatan: AdminCard[] = [];
  if (urusKandungan) {
    perkhidmatan.push({
      href: "/admin/direktori",
      title: "Direktori",
      description: "Sejarah versi, pemulihan dan eksport CSV.",
    });
  }
  perkhidmatan.push({
    href: "/admin/tempahan",
    title: "Tempahan PKG",
    description: "Kelulusan tempahan dan pengurusan bilik.",
  });
  groups.push({ heading: "Perkhidmatan", cards: perkhidmatan });

  if (canManageUsers(user.peranan)) {
    groups.push({
      heading: "Sistem",
      cards: [
        {
          href: "/admin/users",
          title: "Pengguna",
          description: "Urus akaun pentadbir dan pegawai.",
        },
      ],
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
      {groups.map((group) => (
        <section key={group.heading} className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
            {group.heading}
          </h2>
          {group.blurb ? (
            <p className="mt-1 text-sm text-graphite">{group.blurb}</p>
          ) : null}
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.cards.map((c) => (
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
        </section>
      ))}
    </>
  );
}
