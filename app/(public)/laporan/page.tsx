import type { Metadata } from "next";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { HomeModuleIcon } from "@/components/home/HomeModuleIcon";
import { LAPORAN_ENTRY_OVERRIDE } from "@/lib/laporan-entry";
import { LAPORAN_SECTIONS, getModuleAccent } from "@/lib/module-theme";
import { getSessionUser } from "@/lib/rbac";
import { isKnownPeranan } from "@/lib/roles";

export const metadata: Metadata = {
  title: "CoE Reports — NEXa Manjung",
  description:
    "Pilih Laporan DPD, Laporan PSS, Laporan Akhbar atau Semak Tebus Buku.",
};

const SECTION_TAG: Record<string, string> = {
  "/laporan-dpd": "Pendigitalan",
  "/laporan-pss": "Pusat Sumber Sekolah",
  "/laporan-akhbar": "Langganan Akhbar 2026",
  "/laporan/tebus-buku": "Baucar Buku",
};

export default async function LaporanHubPage() {
  const user = await getSessionUser();
  const showUstp = user?.authKind === "staff" && isKnownPeranan(user.peranan ?? "");
  const accent = getModuleAccent("/laporan");
  const looker = LAPORAN_ENTRY_OVERRIDE.enabled;

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Reports"
        title="Pilih Jenis Laporan"
        accent={accent}
        description={
          looker
            ? "Pilih modul di bawah. DPD dan PSS dibuka di Looker Studio; Laporan Akhbar dan Semak Tebus Buku kekal dalam portal."
            : "Pilih modul laporan atau semak status tebus baucar buku."
        }
      />

      <div className="mt-8 grid gap-4">
        {showUstp && (
          <AccentCard href="/admin/laporan-ustp" accent={accent} className="flex items-start gap-4 p-6">
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accent}14`, color: accent }}
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
              >
                <rect x="6" y="4" width="12" height="17" rx="2" />
                <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
                <path d="M9 11h6M9 15h4" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">Laporan Program USTP</span>
              <span className="mt-1.5 block text-sm leading-relaxed text-graphite">
                Rekod program USTP mengikut bulan, urus gambar dan muat turun laporan PDF.
              </span>
            </span>
            <span aria-hidden className="text-xl text-graphite">→</span>
          </AccentCard>
        )}
        {LAPORAN_SECTIONS.map((s) => (
          <AccentCard
            key={s.internalHref}
            href={s.href}
            accent={s.accent}
            external={s.external}
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
                {s.external ? " · Looker Studio" : ""}
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
