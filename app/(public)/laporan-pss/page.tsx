import LaporanPssForm from "@/components/laporan/LaporanPssForm";
import { listSchoolOptions } from "@/lib/direktori/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Laporan PSS — eUSTP Manjung" };

export default async function LaporanPssPage() {
  const schools = await listSchoolOptions();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <h1 className="text-3xl font-medium tracking-tight">Laporan PSS</h1>
      <p className="mt-2 text-graphite">
        Pelaporan aktiviti Pusat Sumber Sekolah, daerah Manjung. Laporan web
        dijana serta-merta selepas hantaran.
      </p>
      <div className="mt-8">
        {schools.length === 0 ? (
          <div className="card p-6 text-graphite">
            Senarai sekolah belum tersedia. Sila hubungi pentadbir USTP.
          </div>
        ) : (
          <LaporanPssForm schools={schools} />
        )}
      </div>
    </div>
  );
}
