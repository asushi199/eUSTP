import type { Metadata } from "next";
import LaporanHubChoiceCard from "@/components/laporan/LaporanHubChoice";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import {
  getLaporanHubChoices,
  LAPORAN_ENTRY_OVERRIDE,
} from "@/lib/laporan-entry";

export const metadata: Metadata = {
  title: "Pelaporan — eUSTP Manjung",
  description: "Pilih Laporan DPD atau Laporan PSS.",
};

export default function LaporanHubPage() {
  const choices = getLaporanHubChoices();
  const looker = LAPORAN_ENTRY_OVERRIDE.enabled;

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Pelaporan"
        title="Pilih Jenis Laporan"
        accent="#DB2777"
        description={
          looker
            ? "Pilih dashboard Looker Studio di bawah. Pautan akan dibuka dalam tab baharu."
            : "Pilih modul laporan untuk meneruskan hantaran borang."
        }
      />
      <div className="mt-8 grid gap-4">
        {choices.map((choice) => (
          <LaporanHubChoiceCard key={choice.kind} choice={choice} />
        ))}
      </div>
    </PublicPageShell>
  );
}
