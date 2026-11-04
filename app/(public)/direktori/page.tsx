import type { Metadata } from "next";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { HomeModuleIcon } from "@/components/home/HomeModuleIcon";
import { DIREKTORI_SECTIONS, getModuleAccent } from "@/lib/module-theme";
import { getSessionUser } from "@/lib/rbac";
import { isKnownPeranan } from "@/lib/roles";

export const metadata: Metadata = {
  title: "CoE Directory — NEXa Manjung",
  description:
    "Pilih Direktori Sekolah atau Direktori USTP daerah Manjung.",
};

const SECTION_TAG: Record<string, string> = {
  "/direktori/sekolah": "Pengurusan & Penyelaras",
  "/direktori/ustp": "Organisasi & Pegawai",
};

export default async function DirektoriHubPage() {
  const user = await getSessionUser();
  const showStaffDirectory = user?.authKind === "staff" && isKnownPeranan(user.peranan ?? "");
  const accent = getModuleAccent("/direktori");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Directory"
        title="Pilih Direktori"
        accent={accent}
        description="Direktori perhubungan sekolah terbuka; Direktori USTP memerlukan akaun MOE-DL; Direktori PPD untuk staf yang log masuk."
      />

      <div className="mt-8 grid gap-4">
        {showStaffDirectory && (
          <AccentCard href="/admin/direktori-ppd" accent={accent} className="flex items-start gap-4 p-6">
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accent}14`, color: accent }}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
                <path d="M17 11h4M17 15h4" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">Direktori PPD</span>
              <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: accent }}>
                Staf sahaja
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-graphite">
                Senarai pegawai PPD Manjung — gred, jawatan dan no. telefon. Dilihat selepas log masuk.
              </span>
            </span>
            <span aria-hidden className="text-xl text-graphite">→</span>
          </AccentCard>
        )}
        {DIREKTORI_SECTIONS.map((s) => (
          <AccentCard
            key={s.internalHref}
            href={s.href}
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
