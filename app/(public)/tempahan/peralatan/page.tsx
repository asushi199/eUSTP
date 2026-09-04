import type { Metadata } from "next";
import Link from "next/link";
import EquipmentCatalog from "@/components/peralatan/EquipmentCatalog";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { withDbTimeout } from "@/lib/db";
import { listEquipmentCatalog } from "@/lib/peralatan/queries";
import type { EquipmentCatalogItem } from "@/lib/peralatan/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventori Peralatan — CoE Services — NEXa Manjung",
  description:
    "Semak ketersediaan dan mohon pinjaman peralatan Maker Lab di lima PKG daerah Manjung.",
};

export default async function PeminjamanPeralatanPage() {
  let items: EquipmentCatalogItem[] = [];
  let unavailable = false;
  try {
    items = await withDbTimeout(listEquipmentCatalog());
  } catch {
    unavailable = true;
  }

  return (
    <PublicPageShell>
      <Link href="/tempahan" className="text-sm text-graphite hover:text-ink">
        ← CoE Services
      </Link>
      <PageHeader
        eyebrow="Peminjaman Peralatan"
        title="Inventori Peralatan"
        accent="#024AD8"
        description="Pilih peralatan yang tersedia, kemudian lengkapkan borang permohonan."
        className="mt-2"
      />
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/tempahan/peralatan/semak" className="btn-outline-ink btn-sm">
          Semak Permohonan Saya
        </Link>
      </div>
      {unavailable ? (
        <div className="card mt-8 p-5 text-sm leading-relaxed text-graphite">
          Modul inventori sedang disediakan. Pentadbir perlu menjalankan migrasi
          pangkalan data sebelum stok boleh dipaparkan.
        </div>
      ) : (
        <EquipmentCatalog items={items} />
      )}
    </PublicPageShell>
  );
}
