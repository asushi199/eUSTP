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

export default async function AdminOscUrusPage() {
  await requireKandunganAccess();

  return (
    <>
      <Link
        href="/admin/osc"
        className="inline-flex items-center gap-1.5 text-sm text-graphite transition hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        OSC
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Urus OSC</h1>
      <p className="mt-1 text-sm text-graphite">
        Kemas kini kandungan OSC — sumber, analisis, pegawai dan tetapan maklumat
        asas.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
