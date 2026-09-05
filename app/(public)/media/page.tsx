import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import MediaExplorer from "@/components/media/MediaExplorer";
import { MEDIA_PLANNED_ITEMS, MEDIA_SOCIAL_LINKS } from "@/lib/media/kategori";
import { toMediaExplorerGroups } from "@/lib/media/card-display";
import { listMediaCardsGrouped } from "@/lib/media/queries";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CoE Media — NEXa Manjung",
  description:
    "Koleksi video, gambar program dan pautan media sosial USTP Manjung.",
};

export default async function MediaPage() {
  const accent = getModuleAccent("/media");
  const groups = toMediaExplorerGroups(await listMediaCardsGrouped());

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Media"
        title="Koleksi Media USTP"
        accent={accent}
        description="Cari video dan gambar program mengikut tajuk atau bulan — atau buka saluran rasmi USTP."
      />
      <MediaExplorer
        groups={groups}
        accent={accent}
        variant="hub"
        linkItems={MEDIA_SOCIAL_LINKS}
        plannedItems={MEDIA_PLANNED_ITEMS}
      />
    </PublicPageShell>
  );
}
