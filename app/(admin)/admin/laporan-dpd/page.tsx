import Link from "next/link";
import DeleteLaporanButton from "@/components/laporan/DeleteLaporanButton";
import StatusSelect from "@/components/laporan/StatusSelect";
import { requireKandunganAccess } from "@/lib/rbac";
import { listLaporanDpd } from "@/lib/laporan/queries";

export const dynamic = "force-dynamic";

export default async function AdminLaporanDpdPage() {
  await requireKandunganAccess();
  const rows = await listLaporanDpd();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Laporan DPD — Admin</h1>
      <p className="mt-1 text-sm text-graphite">{rows.length} laporan</p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Tarikh</th>
              <th className="px-4 py-3 font-semibold">Organisasi</th>
              <th className="px-4 py-3 font-semibold">Program</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-graphite">
                  Belum ada laporan.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b hairline align-top last:border-0">
                <td className="px-4 py-3 text-graphite">{r.id}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(r.tarikh).toLocaleDateString("ms-MY")}
                </td>
                <td className="px-4 py-3">{r.organisasi}</td>
                <td className="px-4 py-3">{r.namaProgram}</td>
                <td className="px-4 py-3">
                  <StatusSelect modul="dpd" laporanId={r.id} status={r.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link href={`/laporan-dpd/${r.id}/cetak`} className="link-blue text-sm">
                      Lihat
                    </Link>
                    <DeleteLaporanButton modul="dpd" laporanId={r.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
