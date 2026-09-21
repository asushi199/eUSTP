import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import OptikTeacherTable from "@/components/analisis/OptikTeacherTable";
import { getOptikSchoolDetail } from "@/lib/analisis/optik-queries";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kod: string }>;
}): Promise<Metadata> {
  const { kod } = await params;
  const detail = await getOptikSchoolDetail(kod);
  const name = detail?.school?.schoolName ?? kod.toUpperCase();
  return {
    title: `${name} — AI Tools — NEXa Manjung`,
    description: `Status PLC AI Tools guru ${name}.`,
  };
}

export default async function AnalisisAiToolsSchoolPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const detail = await getOptikSchoolDetail(kod);
  if (!detail?.school) notFound();
  const accent = getModuleAccent("/analisis");
  const { school, teachers, snapshotLabel } = detail;
  const belum = teachers.filter((row) => row.plcStatus !== "Selesai").length;

  return (
    <PublicPageShell>
      <p>
        <Link href="/analisis/ai-tools" className="text-sm text-graphite hover:text-ink">
          ← Senarai sekolah
        </Link>
      </p>
      <PageHeader
        eyebrow="CoE Analytics"
        title={school.schoolName}
        accent={accent}
        description={`${school.schoolCode} · ${snapshotLabel}`}
      />
      <p className="mt-4 text-sm text-graphite">
        {school.selesaiBil.toLocaleString("ms-MY")} / {school.totalBil.toLocaleString("ms-MY")} guru
        selesai ({school.pctAi.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}%) · PLC{" "}
        {school.plcStatus}
        {teachers.length > 0 ? ` · ${belum} belum selesai` : ""}.
      </p>
      <OptikTeacherTable teachers={teachers} />
    </PublicPageShell>
  );
}
