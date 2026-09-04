import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import CardEmbed from "@/components/kandungan/CardEmbed";
import { getModuleAccent } from "@/lib/module-theme";
import { resourceCardDisplay } from "@/lib/resources/card-display";
import { resourcesKategoriBySlug } from "@/lib/resources/kategori";
import { listResourcesCards } from "@/lib/resources/queries";

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
  const rows = await listResourcesCards(meta.slug);
  const cards = rows.map((c) => ({
    ...c,
    ...resourceCardDisplay(c.url),
  }));

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

      {cards.length === 0 ? (
        <p className="mt-8 py-8 text-center text-sm text-graphite">
          Kandungan akan ditambah kemudian.
        </p>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <CardEmbed
              key={c.id}
              title={c.title}
              blurb=""
              url={c.url}
              typeLabel={c.typeLabel}
              embed={c.embed}
            />
          ))}
        </div>
      )}
    </PublicPageShell>
  );
}
