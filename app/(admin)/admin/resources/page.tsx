import Link from "next/link";
import ResourcesKategoriSections from "@/components/resources/ResourcesKategoriSections";
import { getModuleAccent } from "@/lib/module-theme";
import { getTelegramBotUsername } from "@/lib/telegram/client";
import { requireKandunganAccess } from "@/lib/rbac";
import { toResourcesSectionGroups } from "@/lib/resources/card-display";
import { resourcesKategoriBySlug } from "@/lib/resources/kategori";
import { listResourcesCardsGrouped } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const selected = resourcesKategoriBySlug(sp.kategori ?? "");
  const groups = toResourcesSectionGroups(
    await listResourcesCardsGrouped({ includeHidden: true }),
  );
  const accent = getModuleAccent("/resources");
  const bot = getTelegramBotUsername();

  return (
    <>
      <div>
        <Link
          href={selected ? "/admin/resources" : "/admin"}
          className="text-sm text-graphite hover:text-ink"
        >
          {selected ? "← CoE Resources" : "← Papan Admin"}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {selected ? selected.title : "CoE Resources"}
        </h1>
        <p className="mt-1 text-sm text-graphite">
          {selected
            ? selected.blurb
            : `Ketik kad kategori untuk urus surat mengikut bulan. Muat naik fail ke Google Drive, atau hantar PDF kepada NexaBot${bot ? ` (@${bot})` : ""} dengan /surat — dalam sembang peribadi atau kumpulan.`}
        </p>
      </div>

      <ResourcesKategoriSections
        groups={groups}
        selectedSlug={selected?.slug}
        accent={accent}
      />
    </>
  );
}
