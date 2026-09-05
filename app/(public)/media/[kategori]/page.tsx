import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import DbUnavailableNotice from "@/components/DbUnavailableNotice";
import MediaExplorer from "@/components/media/MediaExplorer";
import { toMediaExplorerGroups } from "@/lib/media/card-display";
import { mediaKategoriBySlug } from "@/lib/media/kategori";
import { listMediaCards } from "@/lib/media/queries";
import { withDbTimeout } from "@/lib/db";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kategori: string }>;
}): Promise<Metadata> {
  const { kategori } = await params;
  const meta = mediaKategoriBySlug(kategori);
  return { title: meta ? `${meta.title} — NEXa Manjung` : "CoE Media" };
}

export default async function MediaKategoriPage({
  params,
}: {
  params: Promise<{ kategori: string }>;
}) {
  const { kategori } = await params;
  const meta = mediaKategoriBySlug(kategori);
  if (!meta) notFound();

  const accent = getModuleAccent("/media");
  const cards = await withDbTimeout(listMediaCards(meta.slug)).catch((e) => {
    console.error(
      "[media/kategori] listMediaCards gagal:",
      e instanceof Error ? e.message : e,
    );
    return null;
  });
  const groups = cards
    ? toMediaExplorerGroups([
        { slug: meta.slug, title: meta.title, blurb: meta.blurb, cards },
      ])
    : null;

  return (
    <PublicPageShell>
      <Link href="/media" className="text-sm text-graphite hover:text-ink">
        ← CoE Media
      </Link>
      <PageHeader
        eyebrow="CoE Media"
        title={meta.title}
        accent={accent}
        description={meta.blurb}
        className="mt-2"
      />
      {groups ? (
        <MediaExplorer groups={groups} accent={accent} variant="kategori" />
      ) : (
        <DbUnavailableNotice />
      )}
    </PublicPageShell>
  );
}
