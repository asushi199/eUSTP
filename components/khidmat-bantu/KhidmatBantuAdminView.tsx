"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import KhidmatRequestCard from "./KhidmatRequestCard";
import MonthSection, { type MonthItem } from "@/components/admin-month/MonthSection";
import { getServiceDate, getServiceTitle } from "@/lib/khidmat-bantu/date-group";
import { inMonth, shiftMonth, todayParts } from "@/lib/month-view";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";

/**
 * Pandangan admin Khidmat Bantu: gilir tunggu-kelulusan di atas + seksyen
 * berskop-bulan (Kalendar/Senarai). Volum kecil → semua rekod dimuat di pelayan
 * dan bulan ditapis di klien (tarikh dalam JSONB tidak sesuai untuk query SQL
 * per-bulan).
 */
export default function KhidmatBantuAdminView({
  pending,
  others,
}: {
  pending: KhidmatBantuRow[];
  others: KhidmatBantuRow[];
}) {
  const params = useSearchParams();
  const initialView = params.get("view") === "senarai" ? "senarai" : "kalendar";
  const [cursor, setCursor] = useState(() => todayParts());

  const sortedPending = useMemo(
    () =>
      [...pending].sort((a, b) =>
        (getServiceDate(a) ?? "9999-99-99").localeCompare(getServiceDate(b) ?? "9999-99-99"),
      ),
    [pending],
  );

  const monthItems = useMemo<MonthItem[]>(() => {
    return others
      .map((row) => ({ row, date: getServiceDate(row) }))
      .filter((x): x is { row: KhidmatBantuRow; date: string } =>
        x.date != null && inMonth(x.date, cursor.year, cursor.month),
      )
      .map(({ row, date }) => ({
        id: row.id,
        date,
        status: row.status,
        chip: getServiceTitle(row),
        card: <KhidmatRequestCard key={row.id} row={row} bare showDate={false} />,
      }));
  }, [others, cursor]);

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Menunggu kelulusan ({sortedPending.length})</h2>
        {sortedPending.length === 0 ? (
          <div className="card mt-3 p-8 text-center text-sm text-graphite">
            Tiada permohonan menunggu.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {sortedPending.map((row) => (
              <KhidmatRequestCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Rekod mengikut bulan</h2>
        <MonthSection
          year={cursor.year}
          month={cursor.month}
          items={monthItems}
          onPrevMonth={() => setCursor((c) => shiftMonth(c.year, c.month, -1))}
          onNextMonth={() => setCursor((c) => shiftMonth(c.year, c.month, 1))}
          initialView={initialView}
          syncViewToUrl
        />
      </section>
    </div>
  );
}
