import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KioskBoard, {
  type KioskCalendarDay,
  type KioskCell,
  type KioskDay,
} from "@/components/tempahan/kiosk/KioskBoard";
import {
  BULAN_PENUH,
  KIOSK_HARI,
  addDaysIso,
  getKioskConfig,
  kioskRange,
  todayIsoKL,
} from "@/lib/tempahan/kiosk";
import { getPkg, listKioskBookings } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kiosk Tempahan Bilik",
  robots: { index: false, follow: false },
};

type Entry = { purpose: string; name: string };

/**
 * Paparan kiosk awam (tanpa log masuk, tanpa TopNav) untuk skrin menegak di lobi PKG.
 * Hanya tempahan DILULUSKAN bagi bilik dalam `KIOSK_CONFIG` — pending tidak dipaparkan.
 */
export default async function KioskPage({ params }: { params: Promise<{ pkg: string }> }) {
  const { pkg: pkgId } = await params;
  const config = getKioskConfig(pkgId);
  if (!config) notFound();
  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const today = todayIsoKL();
  const { from, to, windowEnd, calendar } = kioskRange(today);
  const roomSlugs = config.rooms.map((r) => r.slug);
  const rows = await listKioskBookings(pkgId, roomSlugs, from, to);

  const booked = new Set(rows.map((b) => `${b.date}|${b.roomSlug}`));
  const bySlot = new Map<string, Entry>();
  for (const b of rows) {
    const key = `${b.date}|${b.roomSlug}|${b.slot}`;
    if (!bySlot.has(key)) bySlot.set(key, { purpose: b.purpose, name: b.name });
  }

  const cellOf = (date: string, slug: string): KioskCell => {
    const full = bySlot.get(`${date}|${slug}|full_day`);
    if (full) return { kind: "full", entry: full };
    const am = bySlot.get(`${date}|${slug}|am`) ?? null;
    const pm = bySlot.get(`${date}|${slug}|pm`) ?? null;
    // Pagi + petang untuk aktiviti yang sama dipaparkan sebagai satu blok sepanjang hari.
    if (am && pm && am.purpose === pm.purpose && am.name === pm.name) {
      return { kind: "full", entry: am };
    }
    return { kind: "half", am, pm };
  };

  const days: KioskDay[] = Array.from({ length: KIOSK_HARI }, (_, i) => {
    const date = addDaysIso(today, i);
    return { date, cells: roomSlugs.map((slug) => cellOf(date, slug)) };
  });

  const calendarWeeks: (KioskCalendarDay | null)[][] = calendar.map((week) =>
    week.map((c) =>
      c
        ? {
            date: c.date,
            inMonth: c.inMonth,
            booked: roomSlugs.map((slug) => booked.has(`${c.date}|${slug}`)),
          }
        : null,
    ),
  );

  const monthIdx = Number(today.slice(5, 7)) - 1;

  return (
    <KioskBoard
      pkgName={pkg.name}
      logoSrc={pkg.logoSrc}
      rooms={config.rooms}
      today={today}
      windowEnd={windowEnd}
      monthLabel={`${BULAN_PENUH[monthIdx]} ${today.slice(0, 4)}`}
      calendar={calendarWeeks}
      days={days}
      generatedAt={new Date().toISOString()}
    />
  );
}
