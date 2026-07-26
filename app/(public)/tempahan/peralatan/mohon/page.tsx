import type { Metadata } from "next";
import Link from "next/link";
import LoanApplicationForm from "@/components/peralatan/LoanApplicationForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import {
  listEquipmentCatalog,
  listEquipmentPkgs,
  listEquipmentSchools,
} from "@/lib/peralatan/queries";

export const metadata: Metadata = {
  title: "Mohon Pinjaman Peralatan — eUSTP Manjung",
  description: "Hantar permohonan pinjaman peralatan daripada satu PKG.",
};

export default async function MohonPinjamanPeralatanPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; pkg?: string }>;
}) {
  const { item, pkg } = await searchParams;
  const [items, pkgs, schools] = await Promise.all([
    listEquipmentCatalog().catch(() => []),
    listEquipmentPkgs().catch(() => []),
    listEquipmentSchools().catch(() => []),
  ]);

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
        title="Permohonan Baharu"
        accent="#024AD8"
        description="Lengkapkan maklumat pemohon, pilih satu PKG dan nyatakan kuantiti peralatan yang diperlukan."
        className="mt-2"
      />
      <LoanApplicationForm
        items={items}
        pkgs={pkgs}
        schools={schools}
        defaultItemId={item}
        defaultPkgId={pkg}
      />
    </PublicPageShell>
  );
}
