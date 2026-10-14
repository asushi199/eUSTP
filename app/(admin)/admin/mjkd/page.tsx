import Link from "next/link";
import AdminMesyuaratBaharuForm from "@/components/mjkd/AdminMesyuaratBaharuForm";
import { requireKandunganAccess } from "@/lib/rbac";
import { formatTarikhMs, labelMesyuarat } from "@/lib/mjkd/enums";
import { bilanganMaklumBalasMengikutMesyuarat, listMesyuarat } from "@/lib/mjkd/queries";

export const dynamic = "force-dynamic";

export default async function AdminMjkdPage() {
  await requireKandunganAccess();
  const [senarai, bilangan] = await Promise.all([
    listMesyuarat(),
    bilanganMaklumBalasMengikutMesyuarat(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maklum Balas MJKD</h1>
          <p className="mt-1 text-sm text-graphite">
            Mesyuarat Jawatankuasa Kurikulum Daerah — minit, perkara tindakan, kehadiran dan
            semakan maklum balas PGB.
          </p>
        </div>
        <Link href="/admin/mjkd/pegawai" className="btn-outline-ink btn-sm">
          Senarai pegawai PPD
        </Link>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-ink">Cipta mesyuarat baharu</h2>
      <AdminMesyuaratBaharuForm
        mesyuaratLain={senarai.map((m) => ({
          id: m.id,
          bil: m.bil,
          tahun: m.tahun,
          label: labelMesyuarat(m),
        }))}
      />

      <h2 className="mt-8 text-lg font-semibold text-ink">Senarai mesyuarat</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Mesyuarat</th>
              <th className="px-4 py-3 font-semibold">Tarikh</th>
              <th className="px-4 py-3 font-semibold">Tempat</th>
              <th className="px-4 py-3 font-semibold">Minit</th>
              <th className="px-4 py-3 font-semibold">Maklum balas</th>
              <th className="px-4 py-3 font-semibold">Dihantar</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {senarai.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-graphite">
                  Belum ada mesyuarat. Cipta yang pertama di atas.
                </td>
              </tr>
            ) : (
              senarai.map((m) => (
                <tr key={m.id} className="border-b hairline last:border-0">
                  <td className="px-4 py-3 font-medium">{labelMesyuarat(m)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatTarikhMs(m.tarikh)}
                    {m.tarikhTamat ? ` – ${formatTarikhMs(m.tarikhTamat)}` : ""}
                  </td>
                  <td className="px-4 py-3">{m.tempat || "—"}</td>
                  <td className="px-4 py-3">{m.minitUrl ? "Ada" : "Belum"}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge">
                      {m.maklumBalasDibuka ? "Dibuka" : "Ditutup"}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{bilangan.get(m.id) ?? 0} sekolah</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/mjkd/${m.id}`} className="link-blue">
                      Buka
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm">
        <Link href="/admin/pelaporan" className="text-graphite hover:text-ink">
          ← CoE Reports
        </Link>
      </p>
    </>
  );
}
