"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import BookingCard from "./BookingCard";
import MonthSection, { type MonthItem } from "@/components/admin-month/MonthSection";
import { formatSlot } from "@/lib/tempahan/booking-rules";
import { formatBulan, shiftMonth } from "@/lib/month-view";
import type { BookingRow } from "@/lib/tempahan/queries";

/**
 * Pandangan admin Tempahan satu PKG: gilir tunggu-kelulusan di atas + seksyen
 * berskop-bulan. Tarikh ialah lajur DB sebenar → bulan aktif diambil per-bulan
 * di pelayan melalui `?bulan`; navigasi bulan menukar param itu.
 */
export default function TempahanAdminView({
  pkgId,
  pending,
  monthBookings,
  roomNames,
  year,
  month,
  initialView,
}: {
  pkgId: string;
  pending: BookingRow[];
  monthBookings: BookingRow[];
  roomNames: Record<string, string>;
  year: number;
  month: number;
  initialView: "kalendar" | "senarai";
}) {
  const router = useRouter();
  const pathname = usePathname();

  function goMonth(delta: number) {
    const next = shiftMonth(year, month, delta);
    const p = new URLSearchParams(window.location.search);
    p.set("bulan", formatBulan(next.year, next.month));
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const roomName = (slug: string) => roomNames[slug] ?? slug;

  const monthItems = useMemo<MonthItem[]>(
    () =>
      monthBookings.map((b) => {
        const rn = roomNames[b.roomSlug] ?? b.roomSlug;
        return {
          id: b.id,
          date: b.date,
          status: b.status,
          chip: `${rn} · ${formatSlot(b.slot)}`,
          card: (
            <BookingCard
              key={b.id}
              pkgId={pkgId}
              booking={b}
              roomName={rn}
              bare
              showDate={false}
            />
          ),
        };
      }),
    [monthBookings, roomNames, pkgId],
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
            {pending.map((b) => (
              <BookingCard
                key={b.id}
                pkgId={pkgId}
                booking={b}
                roomName={roomName(b.roomSlug)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Tempahan mengikut bulan</h2>
        <MonthSection
          year={year}
          month={month}
          items={monthItems}
          onPrevMonth={() => goMonth(-1)}
          onNextMonth={() => goMonth(1)}
          initialView={initialView}
          syncViewToUrl
        />
      </section>
    </div>
  );
}
