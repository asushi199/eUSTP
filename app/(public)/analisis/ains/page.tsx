import type { Metadata } from "next";
import Link from "next/link";
import PublicPageShell from "@/components/PublicPageShell";
import PageHeader from "@/components/PageHeader";
import AinsExplore from "@/components/analisis/AinsExplore";
import { getAnalisisData, metricNum, metricText } from "@/lib/analisis/queries";
import { getAinsTahun, listAinsTahun } from "@/lib/analisis/ains-queries";
import type { AinsBackup } from "@/lib/analisis/ains-types";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Program Ains mengikut sekolah — NEXa Manjung",
  description:
    "Bacaan digital Program Ains daerah Manjung: ringkasan bulanan, senarai sekolah dan murid, mengikut tahun.",
};

/** Halaman awam yang boleh dikongsi kepada semua sekolah (tanpa log masuk). */
export default async function AnalisisAinsPage() {
  const ains = await getAnalisisData("ains");
  const years = await listAinsTahun().catch(() => [] as number[]);
  const initial = years[0] != null ? await getAinsTahun(years[0]).catch(() => null) : null;
  const bil = (n: number | null) => (n == null ? "" : n.toLocaleString("ms-MY"));
  const backup: AinsBackup = {
    tahun: 2025,
    tiles: [
      { label: "Buku Diluluskan", value: bil(metricNum(ains.metrics, "approved")) },
      { label: "Ditolak", value: bil(metricNum(ains.metrics, "rejected")) },
    ],
    bars: [
      { label: "SK", jumlah: metricNum(ains.metrics, "sk_approved", "sk") ?? 0 },
      { label: "SJKC", jumlah: metricNum(ains.metrics, "sjkc_approved", "sjkc") ?? 0 },
      { label: "SJKT", jumlah: metricNum(ains.metrics, "sjkt_approved", "sjkt") ?? 0 },
    ].filter((b) => b.jumlah > 0),
    sourceUrl: metricText(ains.metrics, "source_url"),
    sourceLabel: metricText(ains.metrics, "source_label") || "Buka sumber Ains",
  };
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Analytics"
        title="Program Ains"
        accent={getModuleAccent("/analisis")}
        description="Bacaan digital murid daerah Manjung — ringkasan, sekolah dan murid mengikut bulan."
      />
      <p className="mt-4">
        <Link href="/" className="text-sm text-graphite hover:text-ink">
          ← Laman utama
        </Link>
      </p>
      <AinsExplore years={years} initial={initial} backup={backup} initialLayer="schools" />
    </PublicPageShell>
  );
}
