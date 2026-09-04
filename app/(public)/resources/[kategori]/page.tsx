import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import ResourcesKategoriSections from "@/components/resources/ResourcesKategoriSections";
import { getModuleAccent } from "@/lib/module-theme";
import { toResourcesSectionGroups } from "@/lib/resources/card-display";
import { resourcesKategoriBySlug } from "@/lib/resources/kategori";
import { listResourcesCardsGrouped } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kategori: string }>;
}): Promise<Metadata> {
  const { kategori } = await params;
  const meta = resourcesKategoriBySlug(kategori);
  return { title: meta ? `${meta.title} — NEXa Manjung` : "CoE Resources" };
}

export default async function ResourcesKategoriPage({
  params,
}: {
  params: Promise<{ kategori: string }>;
}) {
  const { kategori } = await params;
  const meta = resourcesKategoriBySlug(kategori);
  if (!meta) notFound();

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
      <ResourcesKategoriSections
        groups={groups}
        defaultOpen={meta.slug}
        accent={accent}
      />
    </PublicPageShell>
  );
}
