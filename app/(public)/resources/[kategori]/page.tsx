import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CardEmbed from "@/components/kandungan/CardEmbed";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
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
  const cards = await listResourcesCards(meta.slug);

  return (
    <PublicPageShell>
      <nav className="text-sm text-graphite" aria-label="Jejak">
        <Link href="/resources" className="hover:text-ink hover:underline">
          CoE Resources
        </Link>{" "}
        / <span className="text-ink">{meta.title}</span>
      </nav>
      <PageHeader
        className="mt-3"
        eyebrow="CoE Resources"
        title={meta.title}
        accent={accent}
        description={meta.blurb}
      />
      <div className="mt-8">
        {cards.length === 0 ? (
          <p className="py-8 text-center text-graphite">
            Kandungan akan ditambah kemudian.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => {
              const display = resourceCardDisplay(c.url);
              return (
                <CardEmbed
                  key={c.id}
                  title={c.title}
                  blurb=""
                  url={c.url}
                  typeLabel={display.typeLabel}
                  embed={display.embed}
                />
              );
            })}
          </div>
        )}
      </div>
    </PublicPageShell>
  );
}
