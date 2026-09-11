import Link from "next/link";
import WhatsAppBroadcastPanel, {
  type BroadcastLetter,
} from "@/components/direktori/WhatsAppBroadcastPanel";
import { requireKandunganAccess } from "@/lib/rbac";
import { listAdminSchools } from "@/lib/direktori/queries";
import { listResourcesCardsGrouped } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export default async function AdminSiaranWhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ surat?: string | string[] }>;
}) {
  await requireKandunganAccess();
  const [records, grouped, sp] = await Promise.all([
    listAdminSchools(),
    listResourcesCardsGrouped({ includeHidden: true }),
    searchParams,
  ]);

  // Arkib (kertas kerja lama) tidak disiarkan — kecualikan daripada pemilih.
  const letters: BroadcastLetter[] = grouped
    .filter((group) => group.slug !== "arkib")
    .flatMap((group) =>
      group.cards
        .filter((card) => card.url.trim())
        .map((card) => ({
          id: card.id,
          title: card.title,
          url: card.url,
          kategoriSlug: group.slug,
          kategoriTitle: group.title,
          letterMonth: card.letterMonth ?? null,
          aktif: card.aktif,
        })),
    );

  const suratRaw = sp.surat;
  const initialLetterIds = (Array.isArray(suratRaw) ? suratRaw : suratRaw ? [suratRaw] : [])
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  return (
    <>
      <Link href="/admin/direktori/sekolah" className="text-sm text-graphite hover:text-ink">
        ← Direktori Sekolah
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Siaran WhatsApp</h1>
      <p className="mt-1 text-sm text-graphite">
        Pilih PKG, jawatan dan surat, kemudian buka perbualan WhatsApp seorang demi seorang.
      </p>

      <div className="mt-6">
        <WhatsAppBroadcastPanel
          records={records}
          letters={letters}
          initialLetterIds={initialLetterIds}
          defaultExpanded
        />
      </div>
    </>
  );
}
