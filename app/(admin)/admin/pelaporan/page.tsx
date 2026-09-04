import Link from "next/link";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type AdminCard = { href: string; title: string; description: string };

const CARDS: AdminCard[] = [
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
    href: "/admin/laporan-akhbar",
    title: "Laporan Akhbar",
    description: "Tinjauan Langganan Akhbar 2026 — termasuk data 2024–2025, semakan PPD & eksport Excel JPN.",
  },
];

export default async function AdminPelaporanPage() {
  await requireKandunganAccess();

  return (
    <>
      <Link href="/admin" className="text-sm text-graphite hover:text-ink">
        ← Papan Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">CoE Reports</h1>
      <p className="mt-1 text-sm text-graphite">
        Semak laporan DPD, PSS dan Akhbar daerah Manjung.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
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
