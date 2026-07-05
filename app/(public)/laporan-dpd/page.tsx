import LaporanDpdForm from "@/components/laporan/LaporanDpdForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata = { title: "Laporan DPD — eUSTP Manjung" };

export default function LaporanDpdPage() {
  const accent = getModuleAccent("/laporan-dpd");

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Laporan DPD"
        title="Laporan DPD"
        accent={accent}
        description="Laporan Program Pendigitalan Sekolah, PPD Manjung. Laporan web dijana serta-merta selepas hantaran — boleh dicetak atau disimpan sebagai PDF."
      />
      <div className="mt-8">
        <LaporanDpdForm />
      </div>
    </PublicPageShell>
  );
}
