import type { Metadata } from "next";
import PublicPageShell from "@/components/PublicPageShell";
import OptikExplore from "@/components/analisis/OptikExplore";
import { getAnalisisData } from "@/lib/analisis/queries";
import {
  applySchoolDirectoryNames,
  getOptikPublicView,
} from "@/lib/analisis/optik-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Tools mengikut sekolah — NEXa Manjung",
  description: "Status PLC AI Tools sekolah daerah Manjung.",
};

export default async function AnalisisAiToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ sekolah?: string }>;
}) {
  const { sekolah } = await searchParams;
  const optik = await getAnalisisData("optik");
  const view = await getOptikPublicView(optik.metrics);
  const schools = await applySchoolDirectoryNames(view.schools);
  const summary = view.current
    ? `${view.current.selesaiPct.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}% selesai (${view.current.selesaiBil.toLocaleString("ms-MY")} / ${view.current.totalBil.toLocaleString("ms-MY")} guru) · ${view.current.sekolahSelesai} sekolah selesai, ${view.current.sekolahBelum} belum · ${view.current.chartLabel}.`
    : null;

  return (
    <PublicPageShell>
      <OptikExplore
        initialLayer="schools"
        initialSchoolCode={sekolah?.trim().toUpperCase()}
        schools={schools}
        summary={summary}
        schoolsBackHref="/"
        schoolsBackLabel="← Laman utama"
      />
    </PublicPageShell>
  );
}
