import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import OptikSchoolTable from "@/components/analisis/OptikSchoolTable";
import { getAnalisisData, metricText } from "@/lib/analisis/queries";
import {
  applySchoolDirectoryNames,
  getOptikPublicView,
} from "@/lib/analisis/optik-queries";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Tools mengikut sekolah — NEXa Manjung",
  description: "Status PLC AI Tools sekolah daerah Manjung.",
};

export default async function AnalisisAiToolsPage() {
  const optik = await getAnalisisData("optik");
  const view = await getOptikPublicView(optik.metrics);
  const schools = await applySchoolDirectoryNames(view.schools);
  const accent = getModuleAccent("/analisis");
  const asAt = view.current?.capturedOn
    ? view.current.chartLabel
    : metricText(optik.metrics, "as_at");

  return (
    <PublicPageShell>
      <p>
        <Link href="/analisis#optik" className="text-sm text-graphite hover:text-ink">
          ← CoE Analytics
        </Link>
      </p>
      <PageHeader
        eyebrow="CoE Analytics"
        title="AI Tools mengikut sekolah"
        accent={accent}
        description={
          asAt
            ? `Status PLC AI Tools daerah Manjung — ${asAt}.`
            : "Status PLC AI Tools daerah Manjung."
        }
      />
      {view.current ? (
        <p className="mt-4 text-sm text-graphite">
          {view.current.selesaiPct.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}%
          selesai ({view.current.selesaiBil.toLocaleString("ms-MY")} /{" "}
          {view.current.totalBil.toLocaleString("ms-MY")} guru) · {view.current.sekolahSelesai}{" "}
          sekolah selesai, {view.current.sekolahBelum} belum.
        </p>
      ) : (
        <p className="mt-4 text-sm text-graphite">Data sekolah belum dimuat naik.</p>
      )}
      <div className="mt-6">
        <OptikSchoolTable schools={schools} />
      </div>
    </PublicPageShell>
  );
}
