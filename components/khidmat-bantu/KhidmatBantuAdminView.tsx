"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import KhidmatRequestCard from "./KhidmatRequestCard";
import MonthSection, { type MonthItem } from "@/components/admin-month/MonthSection";
import { getServiceDate, getServiceTitle } from "@/lib/khidmat-bantu/date-group";
import { formatBulan } from "@/lib/month-view";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";

/**
 * Pandangan admin Khidmat Bantu: gilir tunggu-kelulusan di atas + seksyen
 * berskop-bulan. Tarikh aktiviti kini lajur DB (`activity_date`) → bulan aktif
 * diambil per-bulan di pelayan via `?bulan`; navigasi bulan menukar param itu.
 */
export default function KhidmatBantuAdminView({
  pending,
  monthRows,
  year,
  month,
  initialView,
}: {
  pending: KhidmatBantuRow[];
  monthRows: KhidmatBantuRow[];
  year: number;
  month: number;
  initialView: "kalendar" | "senarai";
}) {
  const router = useRouter();
  const pathname = usePathname();

  function goTo(y: number, m: number) {
    const p = new URLSearchParams(window.location.search);
    p.set("bulan", formatBulan(y, m));
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const monthItems = useMemo<MonthItem[]>(
    () =>
      monthRows
        .map((row) => ({ row, date: row.activityDate ?? getServiceDate(row) }))
        .filter((x): x is { row: KhidmatBantuRow; date: string } => x.date != null)
        .map(({ row, date }) => ({
          id: row.id,
          date,
          status: row.status,
          chip: getServiceTitle(row),
          card: <KhidmatRequestCard key={row.id} row={row} bare showDate={false} />,
        })),
    [monthRows],
  );

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Menunggu kelulusan ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="card mt-3 p-8 text-center text-sm text-graphite">
            Tiada permohonan menunggu.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((row) => (
              <KhidmatRequestCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Rekod mengikut bulan</h2>
        <MonthSection
          year={year}
          month={month}
          items={monthItems}
          onNavigate={goTo}
          initialView={initialView}
          syncViewToUrl
        />
      </section>
    </div>
  );
}
