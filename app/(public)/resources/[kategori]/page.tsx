import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import DbUnavailableNotice from "@/components/DbUnavailableNotice";
import ResourcesExplorer from "@/components/resources/ResourcesExplorer";
import { withDbTimeout } from "@/lib/db";
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
  const cards = await withDbTimeout(listResourcesCards(meta.slug)).catch((e) => {
    console.error(
      "[resources/kategori] listResourcesCards gagal:",
      e instanceof Error ? e.message : e,
    );
    return null;
  });
  const groups = cards
    ? toResourcesExplorerGroups([
        { slug: meta.slug, title: meta.title, blurb: meta.blurb, cards },
      ])
    : null;

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
      {groups ? (
        <ResourcesExplorer groups={groups} accent={accent} variant="kategori" />
      ) : (
        <DbUnavailableNotice />
      )}
    </PublicPageShell>
  );
}
