import Link from "next/link";
import { requireKandunganAccess } from "@/lib/rbac";
import { AKHBAR_YEAR } from "@/lib/laporan-akhbar/enums";
import { listAkhbarAdminRows } from "@/lib/laporan-akhbar/queries";

export const dynamic = "force-dynamic";

export default async function AdminLaporanAkhbarPage() {
  await requireKandunganAccess();
  const rows = await listAkhbarAdminRows(AKHBAR_YEAR);
  const submitted = rows.filter((r) => r.record).length;
  const disahkan = rows.filter((r) => r.record?.disahkan === "Ya").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Laporan Akhbar {AKHBAR_YEAR}
          </h1>
          <p className="mt-1 text-sm text-graphite">
            {submitted}/{rows.length} sekolah menghantar · {disahkan} disahkan
          </p>
        </div>
        <Link href="/admin/laporan-akhbar/export" className="btn-primary">
          Eksport Excel JPN
        </Link>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Kod</th>
              <th className="px-4 py-3 font-semibold">Sekolah</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Semakan PPD</th>
              <th className="px-4 py-3 font-semibold">Baki (RM)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rec = r.record;
              return (
                <tr key={r.schoolCode} className="border-b hairline last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{r.schoolCode}</td>
                  <td className="px-4 py-3">{r.schoolName}</td>
                  <td className="px-4 py-3">
                    {rec ? (
                      <span className="status-badge">{rec.statusSekolah}</span>
                    ) : (
                      <span className="text-graphite">Belum hantar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {rec ? (
                      <>
                        <div>Lengkap: {rec.semakanLengkap ?? "—"}</div>
                        <div>Disahkan: {rec.disahkan ?? "—"}</div>
                        <div>Pembetulan: {rec.perluPembetulan ?? "—"}</div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {rec
                      ? rec.bakiPeruntukanRm.toLocaleString("ms-MY", {
                          minimumFractionDigits: 2,
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/laporan-akhbar/${encodeURIComponent(r.schoolCode)}`}
                      className="link-blue"
                    >
                      Buka
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm">
        <Link href="/admin/pelaporan" className="text-graphite hover:text-ink">
          ← Pelaporan
        </Link>
      </p>
    </>
  );
}
