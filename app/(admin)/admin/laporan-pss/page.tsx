import Link from "next/link";
import DeleteLaporanButton from "@/components/laporan/DeleteLaporanButton";
import PssMonthlyChart from "@/components/laporan/PssMonthlyChart";
import StatusSelect from "@/components/laporan/StatusSelect";
import { requireKandunganAccess } from "@/lib/rbac";
import { listLaporanPss, pssMonthlyCounts } from "@/lib/laporan/queries";

export const dynamic = "force-dynamic";

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const d = new Date(`${key}-01`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString("ms-MY", { month: "long", year: "numeric" });
}

export default async function AdminLaporanPssPage() {
  await requireKandunganAccess();
  const [rows, monthly] = await Promise.all([listLaporanPss(), pssMonthlyCounts()]);

  // Arkib bulanan — rows sudah diisih menurun mengikut tarikh mula.
  const byMonth = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = monthKey(r.tarikhMula);
    const list = byMonth.get(key) ?? [];
    list.push(r);
    byMonth.set(key, list);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Laporan PSS — Admin</h1>
      <p className="mt-1 text-sm text-graphite">
        {rows.length} laporan · arkib mengikut bulan
      </p>

      <div className="mt-6">
        <PssMonthlyChart data={monthly} />
      </div>

      <div className="mt-6 space-y-8">
        {byMonth.size === 0 && (
          <div className="card p-6 text-graphite">Belum ada laporan.</div>
        )}
        {[...byMonth.entries()].map(([key, list]) => (
          <section key={key}>
            <h2 className="text-lg font-semibold">{monthLabel(key)}</h2>
            <p className="text-xs text-graphite">{list.length} laporan</p>
            <div className="card mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Tarikh</th>
                    <th className="px-4 py-3 font-semibold">Sekolah</th>
                    <th className="px-4 py-3 font-semibold">Program</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-b hairline align-top last:border-0">
                      <td className="px-4 py-3 text-graphite">{r.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(r.tarikhMula).toLocaleDateString("ms-MY")}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.schoolName}</p>
                        <p className="text-xs text-graphite">{r.schoolCode}</p>
                      </td>
                      <td className="px-4 py-3">{r.namaProgram}</td>
                      <td className="px-4 py-3">
                        <StatusSelect modul="pss" laporanId={r.id} status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <Link
                            href={`/laporan-pss/${r.id}/cetak`}
                            className="link-blue text-sm"
                          >
                            Lihat
                          </Link>
                          <DeleteLaporanButton modul="pss" laporanId={r.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
