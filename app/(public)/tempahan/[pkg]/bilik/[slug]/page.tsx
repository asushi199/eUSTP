import Link from "next/link";
import { notFound } from "next/navigation";
import RoomBookingWorkspace from "@/components/tempahan/RoomBookingWorkspace";
import RoomDetailHero from "@/components/tempahan/RoomDetailHero";
import { resolveAmenities } from "@/lib/tempahan/amenities";
import {
  addMonths,
  fromIsoDate,
  isIsoDate,
  listMonthDates,
  startOfMonth,
  toIsoDate,
} from "@/lib/tempahan/date";
import { getPkg, getRoomBySlug, listActiveBookings } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string; slug: string }>;
  searchParams: Promise<{ start?: string; view?: string }>;
}) {
  const { pkg: pkgId, slug } = await params;
  const { start: startParam, view: viewParam } = await searchParams;

  const [pkg, room] = await Promise.all([getPkg(pkgId), getRoomBySlug(pkgId, slug)]);
  if (!pkg || !room || !room.active) notFound();

  const today = toIsoDate(new Date());
  const focusDate = startParam && isIsoDate(startParam) ? startParam : today;
  const monthStart = startOfMonth(focusDate);
  const todayMonthStart = startOfMonth(today);
  const dates = listMonthDates(focusDate);
  const previousStart = addMonths(monthStart, -1);
  const nextStart = addMonths(monthStart, 1);
  const amenities = resolveAmenities(room.amenities ?? []);
  const detailBase = `/tempahan/${pkgId}/bilik/${room.slug}`;
  const monthLabel = fromIsoDate(monthStart).toLocaleDateString("ms-MY", {
    month: "short",
    year: "numeric",
  });
  const initialView = viewParam === "bulan" || viewParam === "month" ? "month" : "week";

  // Muat dari awal bulan yang dipapar supaya slot lepas/awal bulan betul.
  const bookings = await listActiveBookings(pkgId, monthStart);
  const bookingRows = bookings.map((b) => ({
    roomSlug: b.roomSlug,
    date: b.date,
    slot: b.slot,
    status: b.status,
    name: b.name,
    purpose: b.purpose,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-28 xl:px-8 xl:py-12 xl:pb-12">
      <Link href={`/tempahan/${pkgId}`} className="text-sm text-graphite hover:text-ink">
        ← Kembali ke senarai bilik
      </Link>

      <RoomDetailHero
        name={room.name}
        category={room.category}
        capacity={room.capacity}
        imageSrc={room.imageSrc}
        amenities={amenities}
      />

      <RoomBookingWorkspace
        pkgId={pkgId}
        roomSlug={room.slug}
        roomName={room.name}
        roomCapacity={room.capacity}
        bookings={bookingRows}
        dates={dates}
        today={today}
        focusDate={focusDate}
        detailBase={detailBase}
        previousStart={previousStart}
        nextStart={nextStart}
        monthStart={monthStart}
        todayMonthStart={todayMonthStart}
        monthLabel={monthLabel}
        initialView={initialView}
      />
    </div>
  );
}
