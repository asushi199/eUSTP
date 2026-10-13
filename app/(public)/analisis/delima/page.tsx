import type { Metadata } from "next";
import PublicPageShell from "@/components/PublicPageShell";
import DelimaExplore from "@/components/analisis/DelimaExplore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DELIMa mengikut sekolah — NEXa Manjung",
  description: "Peratus penggunaan DELIMa (guru dan murid aktif) setiap sekolah daerah Manjung, mengikut tahun.",
};

/**
 * Halaman awam yang boleh dikongsi kepada semua sekolah. `?tahun=2025` membuka arkib 2025;
 * tanpa parameter = data langsung tahun semasa.
 */
export default async function AnalisisDelimaPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const { tahun } = await searchParams;
  const parsed = Number(tahun);
  return (
    <PublicPageShell>
      <DelimaExplore
        initialLayer="schools"
        initialTahun={Number.isInteger(parsed) ? parsed : undefined}
        backHref="/"
        backLabel="← Laman utama"
      />
    </PublicPageShell>
  );
}
