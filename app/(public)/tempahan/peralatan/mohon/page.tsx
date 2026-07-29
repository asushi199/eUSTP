import type { Metadata } from "next";
import Link from "next/link";
import LoanApplicationForm from "@/components/peralatan/LoanApplicationForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import { loadEquipmentLoanFormData } from "@/lib/peralatan/loan-form-data";
import {
  listEquipmentCatalog,
  listEquipmentPkgs,
  listEquipmentSchools,
} from "@/lib/peralatan/queries";

export const dynamic = "force-dynamic";

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

  let formData;
  try {
    formData = await loadEquipmentLoanFormData(
      {
        listCatalog: listEquipmentCatalog,
        listPkgs: listEquipmentPkgs,
        listSchools: listEquipmentSchools,
      },
      withDbTimeout,
    );
  } catch (error) {
    console.error("[peralatan] Gagal memuatkan borang pinjaman", error);
    return (
      <PublicPageShell>
        <Link
          href="/tempahan/peralatan"
          className="text-sm text-graphite hover:text-ink"
        >
          ← Inventori Peralatan
        </Link>
        <section className="card mt-8 p-6">
          <h1 className="text-xl font-semibold text-ink">
            Borang tidak dapat dimuatkan
          </h1>
          <p className="mt-2 text-sm text-graphite">
            Pangkalan data mengambil masa terlalu lama untuk bertindak balas.
            Sila cuba semula sebentar lagi.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={
                item
                  ? `/tempahan/peralatan/mohon?item=${encodeURIComponent(item)}`
                  : "/tempahan/peralatan/mohon"
              }
              className="btn-primary btn-sm"
            >
              Cuba semula
            </a>
            <Link href="/tempahan/peralatan" className="btn-outline-ink btn-sm">
              Kembali ke inventori
            </Link>
          </div>
        </section>
      </PublicPageShell>
    );
  }

  const { items, pkgs, schools } = formData;

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
