import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan } from "@/lib/roles";
import { countPendingKhidmatBantu } from "@/lib/khidmat-bantu/queries";

export const dynamic = "force-dynamic";

type AdminCard = { href: string; title: string; description: string; badge?: number };

export default async function AdminOverviewPage() {
  const user = await requireUser();
  const urusKandungan = canManageKandungan(user.peranan);
  const khidmatPending = urusKandungan ? await countPendingKhidmatBantu() : 0;

  // Papan hanya memaparkan perkhidmatan yang tiada tab sendiri.
  // Tempahan, OSC dan Pelaporan berada di menu atas / bar bawah.
  const cards: AdminCard[] = [];
  if (urusKandungan) {
    cards.push({
      href: "/admin/direktori",
      title: "CoE Direktori",
      description: "Maklumat perhubungan sekolah, sejarah versi dan eksport CSV.",
    });
    cards.push({
      href: "/admin/khidmat-bantu",
      title: "Khidmat Bantu",
      description: "Kelulusan permohonan ceramah, bengkel, MCP dan lain-lain.",
      badge: khidmatPending,
    });
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Selamat datang, {user.nama}
      </h1>
      <p className="mt-1 text-sm text-graphite">
        Tempahan, OSC dan Pelaporan berada di menu di atas.
      </p>

      {cards.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
            Perkhidmatan
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
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
      ) : (
        <div className="card mt-8 p-6 text-sm text-graphite">
          Gunakan <span className="font-semibold text-ink">Tempahan</span> di menu
          di atas untuk mengurus tempahan PKG anda.
        </div>
      )}
    </>
  );
}
