import type { Metadata } from "next";
import Link from "next/link";
import EquipmentCatalog from "@/components/peralatan/EquipmentCatalog";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import {
  listEquipmentCatalog,
  listEquipmentPkgs,
} from "@/lib/peralatan/queries";
import type {
  EquipmentCatalogItem,
  EquipmentPkg,
} from "@/lib/peralatan/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventori Peralatan — CoE Booking — eUSTP Manjung",
  description:
    "Semak ketersediaan dan mohon pinjaman peralatan Maker Lab di lima PKG daerah Manjung.",
};

export default async function PeminjamanPeralatanPage() {
  let items: EquipmentCatalogItem[] = [];
  let pkgs: EquipmentPkg[] = [];
  let unavailable = false;
  try {
    [items, pkgs] = await Promise.all([
      listEquipmentCatalog(),
      listEquipmentPkgs(),
    ]);
  } catch {
    unavailable = true;
  }

  return (
    <PublicPageShell>
      <Link href="/tempahan" className="text-sm text-graphite hover:text-ink">
        ← CoE Booking
      </Link>
      <PageHeader
        eyebrow="Peminjaman Peralatan"
        title="Inventori Peralatan"
        accent="#024AD8"
        description="Semak stok di semua PKG, kemudian pilih satu lokasi untuk menghantar permohonan pinjaman."
        className="mt-2"
        actions={
          <Link href="/tempahan/peralatan/mohon" className="btn-primary">
            Mohon pinjaman
          </Link>
        }
      />
      {unavailable ? (
        <div className="card mt-8 p-5 text-sm leading-relaxed text-graphite">
          Modul inventori sedang disediakan. Pentadbir perlu menjalankan migrasi
          pangkalan data sebelum stok boleh dipaparkan.
        </div>
      ) : (
        <EquipmentCatalog items={items} pkgs={pkgs} />
      )}
    </PublicPageShell>
  );
}
