import type { Metadata } from "next";
import Link from "next/link";
import EquipmentLoanLookup from "@/components/peralatan/EquipmentLoanLookup";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";

export const metadata: Metadata = {
  title: "Semak Permohonan Peralatan — NEXa Manjung",
  description: "Semak status permohonan pinjaman peralatan menggunakan nombor telefon.",
};

export default function SemakPermohonanPeralatanPage() {
  return (
    <PublicPageShell>
      <Link
        href="/tempahan/peralatan"
        className="text-sm text-graphite hover:text-ink"
      >
        ← Inventori Peralatan
      </Link>
      <PageHeader
        eyebrow="Peminjaman Peralatan"
        title="Semak Permohonan Saya"
        accent="#024AD8"
        description="Lihat status kelulusan, tempoh dan senarai peralatan yang telah dipohon."
        className="mt-2"
      />
      <div className="mx-auto mt-8 max-w-3xl">
        <EquipmentLoanLookup />
      </div>
    </PublicPageShell>
  );
}
