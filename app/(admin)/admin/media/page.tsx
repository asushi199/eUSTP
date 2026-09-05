import Link from "next/link";
import MediaKategoriSections from "@/components/media/MediaKategoriSections";
import { toMediaSectionGroups } from "@/lib/media/card-display";
import { MEDIA_KATEGORI } from "@/lib/media/kategori";
import { listMediaCardsGrouped } from "@/lib/media/queries";
import { getModuleAccent } from "@/lib/module-theme";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const meta =
    MEDIA_KATEGORI.find((k) => k.slug === sp.kategori) ?? MEDIA_KATEGORI[0];
  const groups = toMediaSectionGroups(await listMediaCardsGrouped({ includeHidden: true }));
  const accent = getModuleAccent("/media");

  return (
    <>
      <div>
        <Link href="/admin" className="text-sm text-graphite hover:text-ink">
          ← Papan Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">CoE Media</h1>
        <p className="mt-1 text-sm text-graphite">
          Urus video dan gambar program. Paparan lalai ialah bulan terkini yang
          ada bahan — pilih Semua bulan jika perlu arkib.
        </p>
      </div>

      <MediaKategoriSections
        groups={groups}
        defaultOpen={meta.slug}
        accent={accent}
      />
    </>
  );
}
