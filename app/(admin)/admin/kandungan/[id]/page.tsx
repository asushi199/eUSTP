import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireKandunganAccess } from "@/lib/rbac";
import { db } from "@/lib/db";
import { kandunganCards } from "@/lib/schema";
import { TOPIK_META } from "@/lib/kandungan/topik";
import KandunganCardForm from "@/components/admin/KandunganCardForm";

export const dynamic = "force-dynamic";

export default async function EditKadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireKandunganAccess();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id)) notFound();

  const card = await db.query.kandunganCards.findFirst({ where: eq(kandunganCards.id, id) });
  if (!card) notFound();

  return (
    <>
      <Link
        href={`/admin/kandungan?topik=${card.topik}`}
        className="text-sm text-graphite hover:text-ink"
      >
        ← Kandungan
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit Kad #{card.id}</h1>
      <div className="mt-5">
        <KandunganCardForm
          topikOptions={TOPIK_META.map((t) => ({ topik: t.topik, title: t.title }))}
          values={{
            id: card.id,
            topik: card.topik,
            subtopikKey: card.subtopikKey,
            subtopikTitle: card.subtopikTitle,
            subtopikSort: card.subtopikSort,
            subtopikBlurb: card.subtopikBlurb,
            subtopikIcon: card.subtopikIcon,
            sort: card.sort,
            title: card.title,
            blurb: card.blurb,
            url: card.url,
            type: card.type,
            previewUrl: card.previewUrl,
            aktif: card.aktif,
          }}
        />
      </div>
    </>
  );
}
