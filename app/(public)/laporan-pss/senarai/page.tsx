import Link from "next/link";
import type { Metadata } from "next";
import { listPssPublic } from "@/lib/stats/pss";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Senarai Laporan PSS — eUSTP Manjung",
};

export default async function SenaraiPssPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total, perPage } = await listPssPublic(page);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Senarai Laporan PSS</h1>
          <p className="mt-2 leading-relaxed text-graphite">
            {total.toLocaleString("ms-MY")} laporan Pusat Sumber Sekolah — rujuk
            aktiviti sekolah lain sebagai contoh.
          </p>
        </div>
        <Link href="/laporan-pss" className="btn-primary">
          Hantar Laporan
        </Link>
      </header>

      <div className="card mt-6 overflow-x-auto p-5">
        {items.length === 0 ? (
          <p className="py-6 text-center text-graphite">Tiada laporan lagi.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="hairline border-b text-left text-xs uppercase tracking-[0.7px] text-graphite">
                <th className="pb-2 pr-3 font-medium">Tarikh</th>
                <th className="pb-2 pr-3 font-medium">Sekolah</th>
                <th className="pb-2 pr-3 font-medium">Program</th>
                <th className="pb-2 font-medium">Laporan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
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
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Muka surat">
          {page > 1 ? (
            <Link href={`/laporan-pss/senarai?page=${page - 1}`} className="btn-outline-ink">
              Sebelum
            </Link>
          ) : (
            <span />
          )}
          <span className="text-graphite">
            Muka {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/laporan-pss/senarai?page=${page + 1}`} className="btn-outline-ink">
              Seterusnya
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
