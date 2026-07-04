import Link from "next/link";
import { notFound } from "next/navigation";
import BookingBoard from "@/components/tempahan/BookingBoard";
import { toIsoDate } from "@/lib/tempahan/date";
import { getPkg, listActiveBookings, listRooms } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function PkgTempahanPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const today = toIsoDate(new Date());
  const [rooms, activeBookings] = await Promise.all([
    listRooms(pkgId),
    listActiveBookings(pkgId, today),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/tempahan" className="text-sm text-graphite hover:text-ink">
            ← Semua PKG
          </Link>
          <h1 className="mt-2 text-3xl font-medium tracking-tight">{pkg.name}</h1>
          <p className="mt-1 text-graphite">Tempahan bilik & kemudahan</p>
        </div>
        <Link href={`/tempahan/${pkgId}/semak`} className="btn-outline-ink btn-sm shrink-0">
          Semak Tempahan Saya
        </Link>
      </div>

      <div className="mt-8">
        {rooms.length === 0 ? (
          <div className="card p-6 text-graphite">
            Tiada bilik didaftarkan untuk PKG ini lagi.
          </div>
        ) : (
          <BookingBoard
            pkgId={pkgId}
            rooms={rooms.map((r) => ({
              slug: r.slug,
              name: r.name,
              shortName: r.shortName,
              category: r.category,
              imageSrc: r.imageSrc,
              amenities: r.amenities,
            }))}
            bookings={activeBookings.map((b) => ({
              roomSlug: b.roomSlug,
              date: b.date,
              slot: b.slot,
              status: b.status,
              name: b.name,
              purpose: b.purpose,
            }))}
            today={today}
          />
        )}
      </div>
    </div>
  );
}
