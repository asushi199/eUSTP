import Link from "next/link";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type OscCard = { href: string; title: string; description: string };

/** Kad pengurusan kandungan OSC. */
const URUS_CARDS: OscCard[] = [
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
];

/** Pautan lihat halaman OSC (kini dalaman — perlu log masuk). */
const LIHAT_LINKS: { href: string; label: string }[] = [
  { href: "/osc", label: "Hub OSC" },
  { href: "/sumber", label: "Sumber" },
  { href: "/analisis", label: "Analisis" },
  { href: "/maklumat-asas", label: "Maklumat Asas" },
];

export default async function AdminOscPage() {
  await requireKandunganAccess();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">OSC One Stop Center</h1>
      <p className="mt-1 text-sm text-graphite">
        Urus kandungan OSC — sumber, analisis dan maklumat asas. Halaman OSC kini
        dalaman sahaja (hanya boleh dilihat selepas log masuk).
      </p>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
          Urus Kandungan
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {URUS_CARDS.map((c) => (
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

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
          Lihat Halaman OSC
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {LIHAT_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="btn-outline-ink">
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
