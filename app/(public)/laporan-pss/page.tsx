import LaporanPssForm from "@/components/laporan/LaporanPssForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { listSchoolOptions } from "@/lib/direktori/queries";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export const metadata = { title: "Laporan PSS — eUSTP Manjung" };

export default async function LaporanPssPage() {
  const schools = await listSchoolOptions();
  const accent = getModuleAccent("/laporan-pss");

  return (
    <PublicPageShell narrow>
      <PageHeader
        eyebrow="Laporan PSS"
        title="Laporan PSS"
        accent={accent}
        description="Pelaporan aktiviti Pusat Sumber Sekolah, daerah Manjung. Laporan web dijana serta-merta selepas hantaran."
      />
      <div className="mt-8">
        {schools.length === 0 ? (
          <div className="card p-6 text-graphite">
            Senarai sekolah belum tersedia. Sila hubungi pentadbir USTP.
          </div>
        ) : (
          <LaporanPssForm schools={schools} />
        )}
      </div>
    </PublicPageShell>
  );
}
