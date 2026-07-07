import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan, canManageUsers } from "@/lib/roles";
import { countPendingKhidmatBantu } from "@/lib/khidmat-bantu/queries";
import { countPendingBookings } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

type AdminCard = { href: string; title: string; description: string; badge?: number };
type AdminGroup = { heading: string; blurb?: string; cards: AdminCard[] };

export default async function AdminOverviewPage() {
  const user = await requireUser();
  const urusKandungan = canManageKandungan(user.peranan);

  const pkgScope =
    user.peranan === "PKG_Admin" ? (user.pkgId ? [user.pkgId] : []) : undefined;
  const [khidmatPending, tempahanPending] = await Promise.all([
    urusKandungan ? countPendingKhidmatBantu() : Promise.resolve(0),
    countPendingBookings(pkgScope),
  ]);

  const groups: AdminGroup[] = [];

  // Perkhidmatan diletak dahulu — modul dengan permohonan menunggu tindakan.
  const perkhidmatan: AdminCard[] = [];
  if (urusKandungan) {
    perkhidmatan.push({
      href: "/admin/direktori",
      title: "Direktori",
      description: "Sejarah versi, pemulihan dan eksport CSV.",
    });
    perkhidmatan.push({
      href: "/admin/khidmat-bantu",
      title: "Khidmat Bantu",
      description: "Kelulusan permohonan ceramah, bengkel, MCP dan lain-lain.",
      badge: khidmatPending,
    });
  }
  perkhidmatan.push({
    href: "/admin/tempahan",
    title: "Tempahan PKG",
    description: "Kelulusan tempahan dan pengurusan bilik.",
    badge: tempahanPending,
  });
  groups.push({ heading: "Perkhidmatan", cards: perkhidmatan });

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
      blurb: "Kandungan OSC (dalaman) — sumber, analisis dan maklumat asas.",
      cards: [
        {
          href: "/admin/osc",
          title: "OSC USTP",
          description: "Lihat hab OSC atau urus kandungannya (sumber, analisis, pegawai, tetapan).",
        },
      ],
    });
  }

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
                className="card relative p-5 transition hover:-translate-y-0.5 hover:shadow-modal"
              >
                {c.badge ? (
                  <span
                    className="absolute right-3 top-3 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white"
                    aria-label={`${c.badge} permohonan baharu menunggu tindakan`}
                  >
                    {c.badge > 9 ? "9+" : c.badge}
                  </span>
                ) : null}
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
