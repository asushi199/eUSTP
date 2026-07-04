import Link from "next/link";
import type { Metadata } from "next";
import { TOPIK_META } from "@/lib/kandungan/topik";
import { countCardsByTopik } from "@/lib/kandungan/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sumber USTP — eUSTP Manjung",
  description:
    "Kertas kerja, laporan, hebahan dan bahan sokongan Unit Sumber Teknologi Pendidikan PPD Manjung.",
};

export default async function SumberPage() {
  const counts = await countCardsByTopik();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <header>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Sumber USTP</h1>
        <p className="mt-2 max-w-xl leading-relaxed text-graphite">
          Bahan rasmi Unit Sumber Teknologi Pendidikan PPD Manjung — kertas
          kerja, laporan, hebahan dan bahan sokongan, dikemas kini oleh pentadbir.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOPIK_META.map((t) => {
          const n = counts.get(t.topik) ?? 0;
          return (
            <Link
              key={t.slug}
              href={`/sumber/${t.slug}`}
              className="card group flex items-start justify-between gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-modal"
            >
              <span>
                <span className="text-lg font-semibold">{t.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-graphite">
                  {t.blurb}
                </span>
                <span className="status-badge mt-3 inline-block">{n} bahan</span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-1 h-5 w-5 shrink-0 text-steel transition group-hover:translate-x-0.5 group-hover:text-primary"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
