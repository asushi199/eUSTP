import type { Metadata } from "next";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { HomeModuleIcon } from "@/components/home/HomeModuleIcon";
import { OSC_SECTIONS, getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "OSC USTP — eUSTP Manjung",
  description:
    "One Stop Center Unit Sumber Teknologi Pendidikan PPD Manjung — sumber, analisis dan maklumat asas dalam satu pusat.",
};

/** Label kategori ringkas untuk setiap seksyen OSC. */
const SECTION_TAG: Record<string, string> = {
  "/sumber": "Bahan & Dokumen",
  "/analisis": "Data & Carta",
  "/maklumat-asas": "Organisasi & Takwim",
};

export default function OscPage() {
  const accent = getModuleAccent("/osc");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="One Stop Center"
        title="OSC USTP"
        accent={accent}
        description="Pusat setempat Unit Sumber Teknologi Pendidikan — bahan rasmi, analisis data dan maklumat asas unit, semuanya dari satu pintu."
      />

      <div className="mt-8 grid gap-4">
        {OSC_SECTIONS.map((s) => (
          <AccentCard
            key={s.internalHref}
            href={s.internalHref}
            accent={s.accent}
            className="flex items-start gap-4 p-6"
          >
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${s.accent}14`, color: s.accent }}
              aria-hidden
            >
              <HomeModuleIcon iconKey={s.iconKey} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{s.title}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={s.accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              <span
                className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: s.accent }}
              >
                {SECTION_TAG[s.internalHref]}
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-graphite">
                {s.description}
              </span>
            </span>
          </AccentCard>
        ))}
      </div>
    </PublicPageShell>
  );
}
