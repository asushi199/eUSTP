import Link from "next/link";
import { withDbTimeout } from "@/lib/db";
import { requireKandunganAccess } from "@/lib/rbac";
import { ringkasanIkutSekolah, type RingkasanSekolahSemakAins } from "@/lib/tools/semak-ains/queries";

export const dynamic = "force-dynamic";

function tarikh(s: string): string {
  return new Date(s).toLocaleString("ms-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  });
}

export default async function AdminSemakAinsPage() {
  await requireKandunganAccess();
  let baris: RingkasanSekolahSemakAins[];
  try {
    baris = await withDbTimeout(ringkasanIkutSekolah());
  } catch {
    return <p className="card p-6 text-sm text-graphite">Pangkalan data perlahan. Sila muat semula halaman ini.</p>;
  }

  return (
    <>
      <Link href="/admin/pelaporan" className="text-sm text-graphite hover:text-ink">
        ← CoE Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Semak Rekod AINS</h1>
      <p className="mt-1 text-sm text-graphite">
        Penggunaan alat mengikut sekolah — bilangan sahaja, tiada data murid. Data dihantar dari halaman awam
        tanpa log masuk; anggap sebagai petunjuk, bukan statistik rasmi.
      </p>

      {baris.length === 0 ? (
        <p className="card mt-8 p-6 text-sm text-graphite">Belum ada penggunaan direkodkan.</p>
      ) : (
        <div className="card mt-8 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-graphite">
                <th className="p-3">Sekolah</th>
                <th className="p-3">Terakhir guna</th>
                <th className="p-3 text-right">Semakan</th>
                <th className="p-3 text-right">Rekod disemak</th>
                <th className="p-3 text-right">% merah</th>
                <th className="p-3 text-right">Diluluskan</th>
                <th className="p-3 text-right">Ditolak</th>
                <th className="p-3">Tetapan</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={`${b.kodSekolah ?? ""}|${b.namaSekolah}`} className="border-t border-cloud">
                  <td className="p-3">
                    <span className="font-semibold text-ink">{b.namaSekolah}</span>
                    {b.kodSekolah ? <span className="block text-xs text-graphite">{b.kodSekolah}</span> : null}
                  </td>
                  <td className="p-3">{tarikh(b.terakhir)}</td>
                  <td className="p-3 text-right tabular-nums">{b.bilSemakan}</td>
                  <td className="p-3 text-right tabular-nums">{b.bilDisemak.toLocaleString("ms-MY")}</td>
                  <td className="p-3 text-right tabular-nums">
                    {b.bilDisemak ? Math.round((b.bilMerah / b.bilDisemak) * 100) : 0}%
                  </td>
                  <td className="p-3 text-right tabular-nums">{b.bilDiluluskan.toLocaleString("ms-MY")}</td>
                  <td className="p-3 text-right tabular-nums">{b.bilDitolak.toLocaleString("ms-MY")}</td>
                  <td className="p-3 text-xs text-graphite">
                    {b.tetapanDiubah
                      ? b.tetapanTerkini
                        ? Object.entries(b.tetapanTerkini).map(([k, v]) => `${k}: ${String(v)}`).join("; ")
                        : "Diubah"
                      : "Standard daerah"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
