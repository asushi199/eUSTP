import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import ResourcesExplorer from "@/components/resources/ResourcesExplorer";
import { getModuleAccent } from "@/lib/module-theme";
import { toResourcesExplorerGroups } from "@/lib/resources/search";
import { listResourcesCardsGrouped } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CoE Resources — NEXa Manjung",
  description:
    "Surat program, pekeliling dan nota Unit Sumber Teknologi Pendidikan PPD Manjung.",
};

export default async function ResourcesPage() {
  const accent = getModuleAccent("/resources");
  const groups = toResourcesExplorerGroups(await listResourcesCardsGrouped());

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Resources"
        title="Sumber Surat dan Pekeliling"
        accent={accent}
        description="Cari surat ikut tajuk, nama fail atau bulan — atau ketik kad kategori untuk buka bahan di dalamnya."
      />
      <ResourcesExplorer groups={groups} accent={accent} variant="hub" />
    </PublicPageShell>
  );
}
