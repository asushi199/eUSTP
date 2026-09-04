import type { Metadata } from "next";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getModuleAccent } from "@/lib/module-theme";
import { RESOURCES_KATEGORI, resourcesHref } from "@/lib/resources/kategori";
import { countActiveResourcesByKategori } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CoE Resources — NEXa Manjung",
  description:
    "Surat program, pekeliling, nota dan sijil digital Unit Sumber Teknologi Pendidikan PPD Manjung.",
};

export default async function ResourcesPage() {
  const accent = getModuleAccent("/resources");
  const counts = await countActiveResourcesByKategori();

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Resources"
        title="Sumber Surat dan Pekeliling"
        accent={accent}
        description="Surat program, pekeliling, nota dan sijil digital USTP. Pekeliling rasmi sudah boleh dibuka; kategori lain akan ditambah secara berperingkat."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {RESOURCES_KATEGORI.map((k) => {
          const n = counts.get(k.slug) ?? 0;
          return (
            <AccentCard
              key={k.slug}
              href={resourcesHref(k.slug)}
              accent={accent}
              className="flex items-start justify-between gap-4 p-6"
            >
              <span>
                <span className="text-lg font-semibold">{k.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-graphite">
                  {k.blurb}
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
