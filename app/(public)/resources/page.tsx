import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import ResourcesKategoriSections from "@/components/resources/ResourcesKategoriSections";
import { getModuleAccent } from "@/lib/module-theme";
import { toResourcesSectionGroups } from "@/lib/resources/card-display";
import { listResourcesCardsGrouped } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CoE Resources — NEXa Manjung",
  description:
    "Surat program, pekeliling, nota dan sijil digital Unit Sumber Teknologi Pendidikan PPD Manjung.",
};

export default async function ResourcesPage() {
  const accent = getModuleAccent("/resources");
  const groups = toResourcesSectionGroups(await listResourcesCardsGrouped());

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Resources"
        title="Sumber Surat dan Pekeliling"
        accent={accent}
        description="Surat program, pekeliling, nota dan sijil digital USTP. Ketik kad kategori untuk buka bahan di dalamnya."
      />
      <ResourcesKategoriSections groups={groups} accent={accent} />
    </PublicPageShell>
  );
}
