"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MonthNav from "@/components/month-nav/MonthNav";
import { formatUstpDate, ustpPkgLabel } from "@/lib/laporan-ustp/options";
import {
  filterUstpReports,
  type UstpReportListItem,
} from "@/lib/laporan-ustp/search";

export default function UstpReportList({
  reports,
  month,
}: {
  reports: UstpReportListItem[];
  month: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterUstpReports(reports, query),
    [reports, query],
  );
  const searching = Boolean(query.trim());

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label htmlFor="carian-laporan-ustp" className="label">
            Cari laporan
          </label>
          <div className="relative">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-graphite"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              id="carian-laporan-ustp"
              className="input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nama program, PKG atau penyedia"
              autoComplete="off"
            />
          </div>
        </div>
        <MonthNav value={month} path="/admin/laporan-ustp" showToday />
      </div>

      {searching ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-graphite">
          <span>{filtered.length} laporan sepadan pada bulan ini</span>
          <button
            type="button"
            className="font-medium text-ink underline-offset-2 hover:underline"
            onClick={() => setQuery("")}
          >
            Kosongkan carian
          </button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="card p-6 text-sm text-graphite">
          {reports.length === 0
            ? "Tiada laporan pada bulan ini. Pilih bulan lain atau tambah laporan."
            : "Tiada laporan sepadan. Ubah kata carian atau bulan."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <article
              key={report.id}
              className="card flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-graphite">
                  {formatUstpDate(report.startDate)} – {formatUstpDate(report.endDate)}
                </p>
                <h3 className="mt-1 break-words font-semibold">{report.programName}</h3>
                <p className="mt-1 text-sm text-graphite">{ustpPkgLabel(report.pkgCode)}</p>
                <p className="mt-1 text-xs text-graphite">Disediakan oleh: {report.preparedBy}</p>
              </div>
              <div className="flex gap-3">
                <Link href={`/admin/laporan-ustp/${report.id}`} className="btn-outline-ink">
                  Lihat
                </Link>
                <Link href={`/admin/laporan-ustp/${report.id}/edit`} className="btn-outline-ink">
                  Edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
