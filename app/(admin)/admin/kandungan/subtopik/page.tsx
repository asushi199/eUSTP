import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { requireKandunganAccess } from "@/lib/rbac";
import { db } from "@/lib/db";
import { kandunganCards } from "@/lib/schema";
import { TOPIK_META } from "@/lib/kandungan/topik";
import SubtopikGroupForm from "@/components/admin/SubtopikGroupForm";

export const dynamic = "force-dynamic";

export default async function SubtopikGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ topik?: string; key?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const meta = TOPIK_META.find((t) => t.topik === sp.topik);
  const key = (sp.key ?? "").trim();
  if (!meta || !key) notFound();

  const cards = await db
    .select()
    .from(kandunganCards)
    .where(and(eq(kandunganCards.topik, meta.topik), eq(kandunganCards.subtopikKey, key)))
    .orderBy(asc(kandunganCards.sort));
  if (cards.length === 0) notFound();
  const first = cards[0];

  return (
    <>
      <Link
        href={`/admin/kandungan?topik=${meta.topik}`}
        className="text-sm text-graphite hover:text-ink"
      >
        ← Kandungan
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Edit Subtopik — {first.subtopikTitle || key}
      </h1>
      <p className="mt-1 text-sm text-graphite">{meta.title}</p>
      <div className="mt-5">
        <SubtopikGroupForm
          topik={meta.topik}
          subtopikKey={key}
          cardCount={cards.length}
          values={{
            title: first.subtopikTitle,
            sort: first.subtopikSort,
            blurb: first.subtopikBlurb,
            icon: first.subtopikIcon,
          }}
        />
      </div>
    </>
  );
}
