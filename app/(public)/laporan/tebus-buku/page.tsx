import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import SchoolDirectory from "@/components/tebus-buku/SchoolDirectory";
import { withDbTimeout } from "@/lib/db";
import { formatTarikhSnapshot } from "@/lib/tebus-buku/format";
import { listTebusBukuSchools } from "@/lib/tebus-buku/queries";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Semak Tebus Buku — CoE Laporan — NEXa Manjung",
  description:
    "Semak status tebus dan guna baucar buku pelajar sekolah menengah daerah Manjung.",
};

export default async function TebusBukuIndexPage() {
  const accent = getModuleAccent("/laporan/tebus-buku");
  let schools: Awaited<ReturnType<typeof listTebusBukuSchools>>["schools"] = [];
  let sourcedAt: string | null = null;
  let unavailable = false;

  try {
    const data = await withDbTimeout(listTebusBukuSchools());
    schools = data.schools;
    sourcedAt = data.sourcedAt;
  } catch {
    unavailable = true;
  }

  const tarikh = formatTarikhSnapshot(sourcedAt);

  return (
    <PublicPageShell narrow>
      <Link href="/laporan" className="text-sm text-graphite hover:text-ink">
        ← CoE Laporan
      </Link>
      <PageHeader
        eyebrow="CoE Laporan"
        title="Semak Tebus Buku"
        accent={accent}
        description={
          tarikh
            ? `Pilih sekolah, kemudian cari pelajar. Data sekolah menengah Manjung setakat ${tarikh}.`
            : "Pilih sekolah, kemudian cari pelajar untuk semak status tebus dan guna baucar buku."
        }
        className="mt-2"
      />
      {unavailable ? (
        <div className="card mt-8 p-5 text-sm leading-relaxed text-graphite">
          Direktori tebus buku sedang disediakan. Pentadbir perlu mengimport
          data pelajar sebelum senarai sekolah boleh dipaparkan.
        </div>
      ) : schools.length === 0 ? (
        <div className="card mt-8 p-5 text-sm leading-relaxed text-graphite">
          Belum ada data pelajar. Import senarai PPD MANJUNG terlebih dahulu.
        </div>
      ) : (
        <SchoolDirectory schools={schools} />
      )}
    </PublicPageShell>
  );
}
