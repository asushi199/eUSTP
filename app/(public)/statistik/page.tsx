import Link from "next/link";
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getDpdByTeras, getDpdKpiTiles, getDpdMonthly } from "@/lib/stats/dpd";
import { getPssByDimensi, getPssKpiTiles, getPssMonthly, listPssPublic } from "@/lib/stats/pss";
import { getModuleAccent } from "@/lib/module-theme";
import StatKpiTiles from "@/components/stats/StatKpiTiles";
import MonthlyLineChart from "@/components/stats/MonthlyLineChart";
import BreakdownBarChart from "@/components/stats/BreakdownBarChart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistik Laporan — eUSTP Manjung",
  description:
    "Statistik terkini Laporan DPD dan Laporan PSS sekolah-sekolah daerah Manjung.",
};

export default async function StatistikPage() {
  const tahun = new Date().getFullYear();
  const [dpdTiles, dpdMonthly, dpdTeras, pssTiles, pssMonthly, pssDimensi, pssRecent] =
    await Promise.all([
      getDpdKpiTiles(tahun),
      getDpdMonthly(tahun),
      getDpdByTeras(tahun),
      getPssKpiTiles(tahun),
      getPssMonthly(tahun),
      getPssByDimensi(tahun),
      listPssPublic(1, 10),
    ]);

  const accent = getModuleAccent("/statistik");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="Statistik"
        title={`Statistik Laporan ${tahun}`}
        accent={accent}
        description="Data dikira terus daripada laporan yang dihantar oleh sekolah — dikemas kini serta-merta selepas setiap hantaran."
      />

      {/* ---------- DPD ---------- */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Pelaporan Dasar Pendidikan Digital (DPD)</h2>
        <div className="mt-4">
          <StatKpiTiles tiles={dpdTiles} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MonthlyLineChart
            title="Jumlah Program Sebulan"
            data={dpdMonthly}
            seriesName="Program"
          />
          <BreakdownBarChart
            title="Jumlah Program Ikut Teras"
            data={dpdTeras}
            seriesName="Program"
          />
        </div>
        <div className="mt-3">
          <Link href="/laporan-dpd/senarai" className="link-blue text-sm">
            Lihat senarai laporan DPD
          </Link>
        </div>
      </section>

      {/* ---------- PSS ---------- */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Laporan Pengurusan Pusat Sumber Sekolah (PSS)</h2>
        <div className="mt-4">
          <StatKpiTiles tiles={pssTiles} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MonthlyLineChart
            title="Jumlah Laporan Sebulan"
            data={pssMonthly}
            seriesName="Laporan"
          />
          <BreakdownBarChart
            title="Jumlah Laporan Ikut Dimensi"
            data={pssDimensi}
            seriesName="Laporan"
          />
        </div>

        {pssRecent.items.length > 0 && (
          <div className="card mt-4 overflow-x-auto p-5">
            <p className="font-semibold">Laporan PSS Terkini</p>
            <table className="mt-3 w-full min-w-[560px] text-sm">
              <thead>
                <tr className="hairline border-b text-left text-xs uppercase tracking-[0.7px] text-graphite">
                  <th className="pb-2 pr-3 font-medium">Tarikh</th>
                  <th className="pb-2 pr-3 font-medium">Sekolah</th>
                  <th className="pb-2 pr-3 font-medium">Program</th>
                  <th className="pb-2 font-medium">Laporan</th>
                </tr>
              </thead>
              <tbody>
                {pssRecent.items.map((r) => (
                  <tr key={r.id} className="hairline border-b last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{r.tarikhMula}</td>
                    <td className="py-2 pr-3">
                      {r.schoolCode} {r.schoolName}
                    </td>
                    <td className="py-2 pr-3">{r.namaProgram}</td>
                    <td className="py-2 whitespace-nowrap">
                      <Link href={`/laporan-pss/${r.id}/cetak`} className="link-blue">
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Link href="/laporan-pss/senarai" className="link-blue text-sm">
            Lihat senarai laporan PSS
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
