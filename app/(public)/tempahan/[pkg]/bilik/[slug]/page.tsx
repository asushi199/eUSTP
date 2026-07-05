import Link from "next/link";
import { notFound } from "next/navigation";
import AmenityIcon from "@/components/tempahan/AmenityIcon";
import BookingForm from "@/components/tempahan/BookingForm";
import CalendarBoard from "@/components/tempahan/CalendarBoard";
import { resolveAmenities } from "@/lib/tempahan/amenities";
import {
  addMonths,
  formatMalayDate,
  listDateRange,
  startOfMonth,
  toIsoDate,
} from "@/lib/tempahan/date";
import { getPkg, getRoomBySlug, listActiveBookings } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string; slug: string }>;
  searchParams: Promise<{ start?: string }>;
}) {
  const { pkg: pkgId, slug } = await params;
  const { start: startParam } = await searchParams;

  const [pkg, room] = await Promise.all([getPkg(pkgId), getRoomBySlug(pkgId, slug)]);
  if (!pkg || !room || !room.active) notFound();

  const today = toIsoDate(new Date());
  const bookings = await listActiveBookings(pkgId, today);

  const start = startOfMonth(startParam || today);
  const dates = listDateRange(start, 30);
  const previousStart = addMonths(start, -1);
  const nextStart = addMonths(start, 1);
  const amenities = resolveAmenities(room.amenities ?? []);
  const detailBase = `/tempahan/${pkgId}/bilik/${room.slug}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-8">
      <Link href={`/tempahan/${pkgId}`} className="text-sm text-graphite hover:text-ink">
        ← Kembali ke senarai bilik
      </Link>

      <section className="mt-4 grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="overflow-hidden rounded-xl border hairline bg-cloud">
          {room.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={room.imageSrc}
              alt={`${room.name} - ${room.category}`}
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-graphite">
              Tiada gambar
            </div>
          )}
        </div>
        <div>
          {room.category && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {room.category}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-medium tracking-tight">{titleCase(room.name)}</h1>

          <div className="mt-4">
            <h2 className="text-sm font-semibold">Kemudahan</h2>
            {amenities.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {amenities.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-sm text-graphite">
                    <AmenityIcon name={item.key} />
                    {item.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-graphite">Tiada maklumat kemudahan.</p>
            )}
          </div>

          <a href="#tempah" className="btn-primary mt-6 inline-flex">
            Tempah bilik ini
          </a>
        </div>
      </section>

      <section className="card mt-10 p-6" id="jadual">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Status tempahan
            </p>
            <h2 className="mt-1 text-xl font-semibold">Paparan Bulanan</h2>
            <p className="mt-1 text-sm text-graphite">
              {formatMalayDate(dates[0])} – {formatMalayDate(dates[dates.length - 1])}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-graphite">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary-soft ring-1 ring-primary/30" />
              Kosong
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              Menunggu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-steel" />
              Diluluskan
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`${detailBase}?start=${previousStart}`}
            scroll={false}
            className="btn-outline-ink btn-sm"
          >
            Sebelum
          </Link>
          <Link
            href={`${detailBase}?start=${today}`}
            scroll={false}
            className="btn-outline-ink btn-sm"
          >
            Bulan ini
          </Link>
          <Link
            href={`${detailBase}?start=${nextStart}`}
            scroll={false}
            className="btn-outline-ink btn-sm"
          >
            Seterusnya
          </Link>
        </div>

        <div className="mt-6">
          <CalendarBoard
            roomSlug={room.slug}
            roomName={room.name}
            bookings={bookings.map((b) => ({
              roomSlug: b.roomSlug,
              date: b.date,
              slot: b.slot,
              status: b.status,
              name: b.name,
              purpose: b.purpose,
            }))}
            dates={dates}
          />
        </div>
      </section>

      <div className="mt-8">
        <BookingForm
          pkgId={pkgId}
          defaultRoomSlug={room.slug}
          rooms={[{ slug: room.slug, name: room.name }]}
          bookings={bookings.map((b) => ({
            roomSlug: b.roomSlug,
            date: b.date,
            slot: b.slot,
            status: b.status,
            name: b.name,
            purpose: b.purpose,
          }))}
        />
      </div>
    </div>
  );
}
