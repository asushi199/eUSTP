import type { Metadata } from "next";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { TOPIK_META } from "@/lib/kandungan/topik";
import { countCardsByTopik } from "@/lib/kandungan/queries";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sumber USTP — eUSTP Manjung",
  description:
    "Kertas kerja, laporan, hebahan dan bahan sokongan Unit Sumber Teknologi Pendidikan PPD Manjung.",
};

export default async function SumberPage() {
  const counts = await countCardsByTopik();
  const accent = getModuleAccent("/sumber");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="OSC USTP · Sumber"
        title="Sumber USTP"
        accent={accent}
        description="Bahan rasmi Unit Sumber Teknologi Pendidikan PPD Manjung — kertas kerja, laporan, hebahan dan bahan sokongan, dikemas kini oleh pentadbir."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOPIK_META.map((t) => {
          const n = counts.get(t.topik) ?? 0;
          return (
            <AccentCard
              key={t.slug}
              href={`/sumber/${t.slug}`}
              accent={accent}
              className="flex items-start justify-between gap-4 p-6"
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
                className="mt-1 h-5 w-5 shrink-0 text-steel transition group-hover:translate-x-0.5"
                style={{ stroke: accent }}
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </AccentCard>
          );
        })}
      </div>
    </PublicPageShell>
  );
}
