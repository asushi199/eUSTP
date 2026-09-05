import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { listUstpReports, resolveUstpMonth } from "@/lib/laporan-ustp/queries";
import { formatUstpDate, ustpPkgLabel } from "@/lib/laporan-ustp/options";
import { currentLetterMonthKey, formatResourceMonthLabel, shiftLetterMonth } from "@/lib/resources/search";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laporan Program USTP" };

export default async function UstpReportsPage({ searchParams }: { searchParams: Promise<{ month?: string; page?: string }> }) {
  await requireUser();
  const params = await searchParams;
  const month = resolveUstpMonth(params.month);
  const page = /^\d{1,5}$/.test(params.page ?? "") ? Math.max(1, Number(params.page)) : 1;
  const { reports, hasNext } = await listUstpReports(month, page);
  const href = (selected: string, nextPage = 1) => `/admin/laporan-ustp?month=${selected}&page=${nextPage}`;
  return <>
    <Link href="/laporan" className="text-sm text-graphite hover:text-ink">← CoE Reports</Link>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">Laporan Program USTP</h1><p className="mt-1 text-sm text-graphite">Rekod program mengikut bulan tarikh mula.</p></div>
      <Link href="/admin/laporan-ustp/baharu" className="btn-primary">Tambah Laporan</Link>
    </div>
    <section className="mt-6" aria-label="Bulan laporan">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={href(shiftLetterMonth(month, -1))} className="btn-outline-ink" aria-label="Bulan sebelumnya">←</Link>
          <h2 className="text-lg font-semibold">{formatResourceMonthLabel(month)}</h2>
          <Link href={href(shiftLetterMonth(month, 1))} className="btn-outline-ink" aria-label="Bulan seterusnya">→</Link>
        </div>
        <form className="flex flex-wrap items-end gap-2" action="/admin/laporan-ustp">
          <label><span className="label">Pilih bulan</span><input type="month" name="month" className="input" defaultValue={month} key={month} min="2000-01" max="2099-12" required /></label>
          <button className="btn-outline-ink" type="submit">Papar</button>
          <Link href={href(currentLetterMonthKey())} className="btn-outline-ink">Bulan Ini</Link>
        </form>
      </div>
      <div className="mt-5 space-y-3">
        {reports.length === 0 && <p className="card p-6 text-sm text-graphite">Tiada laporan pada halaman ini. Pilih bulan lain atau tambah laporan.</p>}
        {reports.map((report) => <article key={report.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1"><p className="text-xs text-graphite">{formatUstpDate(report.startDate)} – {formatUstpDate(report.endDate)}</p><h3 className="mt-1 break-words font-semibold">{report.programName}</h3><p className="mt-1 text-sm text-graphite">{ustpPkgLabel(report.pkgCode)}</p><p className="mt-1 text-xs text-graphite">Disediakan oleh: {report.preparedBy}</p></div>
          <div className="flex gap-3"><Link href={`/admin/laporan-ustp/${report.id}`} className="btn-outline-ink">Lihat</Link><Link href={`/admin/laporan-ustp/${report.id}/edit`} className="btn-outline-ink">Edit</Link></div>
        </article>)}
      </div>
      {(page > 1 || hasNext) && <nav aria-label="Halaman laporan" className="mt-5 flex items-center gap-4">
        {page > 1 && <Link href={href(month, page - 1)} className="btn-outline-ink">Sebelumnya</Link>}
        <span className="text-sm">Halaman {page}</span>
        {hasNext && <Link href={href(month, page + 1)} className="btn-outline-ink">Seterusnya</Link>}
      </nav>}
    </section>
  </>;
}
