import type { Metadata } from "next";
import Link from "next/link";
import LaporanAkhbarForm from "@/components/laporan-akhbar/LaporanAkhbarForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { listSchoolOptions } from "@/lib/direktori/queries";
import { getLaporanAkhbarBySchool } from "@/lib/laporan-akhbar/queries";

export const metadata: Metadata = {
  title: "Laporan Akhbar — NEXa Manjung",
  description: "Tinjauan penyelarasan peruntukan Program Langganan Akhbar 2026.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ kod?: string; kemaskini?: string }>;
};

export default async function LaporanAkhbarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const schools = await listSchoolOptions();
  const kod = sp.kod?.trim().toUpperCase();
  const existing = kod ? await getLaporanAkhbarBySchool(kod) : null;
  const wantUpdate = sp.kemaskini === "1" || Boolean(existing && kod);

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title="Laporan Akhbar 2026"
        accent="#024ad8"
        description="Isi sekali sahaja, termasuk amaun 2026 serta terimaan dan baki peruntukan 2024–2025. Data akan dikumpulkan oleh PPD Manjung untuk dihantar kepada JPN."
      />
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/laporan" className="text-graphite hover:text-ink">
          ← Hub laporan
        </Link>
        <Link href="/laporan-akhbar/semak" className="link-blue">
          Semak status / kemaskini
        </Link>
      </div>
      <div className="mt-8">
        <LaporanAkhbarForm
          schools={schools}
          initialSchoolCode={kod}
          existing={wantUpdate ? existing : null}
          requireReceipt={Boolean(wantUpdate && existing)}
        />
      </div>
    </PublicPageShell>
  );
}
