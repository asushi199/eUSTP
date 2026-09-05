import Link from "next/link";
import { notFound } from "next/navigation";
import CardEmbed from "@/components/kandungan/CardEmbed";
import MediaCardForm from "@/components/admin/MediaCardForm";
import { mediaCardDisplay } from "@/lib/media/card-display";
import { mediaAdminHref } from "@/lib/media/kategori";
import { getMediaCard } from "@/lib/media/queries";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function EditMediaKadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireKandunganAccess();
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();
  const card = await getMediaCard(id);
  if (!card) notFound();

  const display = mediaCardDisplay(card.url);

  return (
    <>
      <Link
        href={mediaAdminHref(card.kategori)}
        className="text-sm text-graphite hover:text-ink"
      >
        ← CoE Media
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit Kad</h1>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <MediaCardForm
          values={{
            id: card.id,
            kategori: card.kategori,
            title: card.title,
            url: card.url,
            letterMonth: card.letterMonth,
            sort: card.sort,
            aktif: card.aktif,
          }}
        />
        <CardEmbed
          title={card.title}
          blurb=""
          url={card.url}
          typeLabel={display.typeLabel}
          embed={display.embed}
        />
      </div>
    </>
  );
}
