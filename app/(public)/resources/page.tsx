import type { Metadata } from "next";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getModuleAccent } from "@/lib/module-theme";
import { resourcesHref } from "@/lib/resources/kategori";
import { listResourcesCardsGrouped } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CoE Resources — NEXa Manjung",
  description:
    "Surat program, pekeliling, nota dan sijil digital Unit Sumber Teknologi Pendidikan PPD Manjung.",
};

export default async function ResourcesPage() {
  const accent = getModuleAccent("/resources");
  const groups = await listResourcesCardsGrouped();

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Resources"
        title="Sumber Surat dan Pekeliling"
        accent={accent}
        description="Surat program, pekeliling, nota dan sijil digital USTP. Ketik kad kategori untuk buka bahan di dalamnya."
      />

      <div className="mt-8 space-y-4">
        {groups.map((group) => {
          const n = group.cards.length;
          return (
            <AccentCard
              key={group.slug}
              href={resourcesHref(group.slug)}
              accent={accent}
              className="flex items-start justify-between gap-4 p-5"
            >
              <span className="min-w-0">
                <span className="block text-lg font-semibold text-ink">
                  {group.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-graphite">
                  {group.blurb}
                </span>
                <span className="status-badge mt-3 inline-block">
                  {n > 0 ? `${n} bahan` : "Akan datang"}
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-1 h-5 w-5 shrink-0 transition group-hover:translate-x-0.5"
                style={{ stroke: accent }}
                aria-hidden
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
