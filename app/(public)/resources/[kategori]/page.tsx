import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import ResourcesExplorer from "@/components/resources/ResourcesExplorer";
import { getModuleAccent } from "@/lib/module-theme";
import { resourcesKategoriBySlug } from "@/lib/resources/kategori";
import { listResourcesCards } from "@/lib/resources/queries";
import { toResourcesExplorerGroups } from "@/lib/resources/search";

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
  const groups = toResourcesExplorerGroups([
    {
      slug: meta.slug,
      title: meta.title,
      blurb: meta.blurb,
      cards: await listResourcesCards(meta.slug),
    },
  ]);

  return (
    <PublicPageShell>
      <Link href="/resources" className="text-sm text-graphite hover:text-ink">
        ← CoE Resources
      </Link>
      <PageHeader
        eyebrow="CoE Resources"
        title={meta.title}
        accent={accent}
        description={meta.blurb}
        className="mt-2"
      />
      <ResourcesExplorer groups={groups} accent={accent} variant="kategori" />
    </PublicPageShell>
  );
}
