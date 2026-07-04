import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOPIK_META, topikBySlug } from "@/lib/kandungan/topik";
import { getTopikGroups } from "@/lib/kandungan/queries";
import CardGrid from "@/components/kandungan/CardGrid";

export const revalidate = 300;

export function generateStaticParams() {
  return TOPIK_META.map((t) => ({ topik: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topik: string }>;
}): Promise<Metadata> {
  const { topik } = await params;
  const meta = topikBySlug(topik);
  return { title: meta ? `${meta.title} — eUSTP Manjung` : "Sumber USTP" };
}

export default async function TopikPage({
  params,
}: {
  params: Promise<{ topik: string }>;
}) {
  const { topik } = await params;
  const meta = topikBySlug(topik);
  if (!meta) notFound();

  const groups = await getTopikGroups(meta.topik);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="text-sm text-graphite" aria-label="Jejak">
        <Link href="/sumber" className="hover:text-ink hover:underline">
          Sumber USTP
        </Link>{" "}
        / <span className="text-ink">{meta.title}</span>
      </nav>
      <header className="mt-3">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{meta.title}</h1>
        <p className="mt-2 max-w-xl leading-relaxed text-graphite">{meta.blurb}</p>
      </header>

      <div className="mt-8">
        <CardGrid groups={groups} />
      </div>
    </div>
  );
}
