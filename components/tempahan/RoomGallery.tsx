import Link from "next/link";
import { amenityCardLayout } from "@/lib/tempahan/amenities";
import AmenityIcon from "./AmenityIcon";

export type RoomGalleryItem = {
  slug: string;
  name: string;
  category: string;
  imageSrc: string | null;
  amenities: string[];
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RoomGallery({
  pkgId,
  rooms,
}: {
  pkgId: string;
  rooms: RoomGalleryItem[];
}) {
  return (
    <section
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Senarai bilik"
    >
      {rooms.map((room) => {
        const card = amenityCardLayout(room.amenities ?? []);
        const hasAmenities = (room.amenities?.length ?? 0) > 0;

        return (
          <Link
            key={room.slug}
            href={`/tempahan/${pkgId}/bilik/${room.slug}`}
            className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-modal"
          >
            <div className="relative aspect-[16/10] bg-cloud">
              {room.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={room.imageSrc}
                  alt={`${room.name} - ${room.category}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-graphite">
                  Tiada gambar
                </div>
              )}
              {room.category && (
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-ink shadow-sm">
                  {room.category}
                </span>
              )}
            </div>
            <div className="space-y-3 p-5">
              <h2 className="text-lg font-semibold">{titleCase(room.name)}</h2>
              {hasAmenities && (
                <div className="space-y-2">
                  {card.textChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5" aria-label="Kemudahan utama">
                      {card.textChips.map((item) => (
                        <span
                          key={item.label}
                          className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5 text-xs text-ink"
                          title={item.label}
                        >
                          <AmenityIcon name={item.key} className="h-3.5 w-3.5" />
                          {item.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {(card.iconChips.length > 0 || card.extraCount > 0) && (
                    <div className="flex flex-wrap gap-1" aria-label="Kemudahan lain">
                      {card.iconChips.map((item) => (
                        <span
                          key={item.label}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cloud text-graphite"
                          title={item.label}
                        >
                          <AmenityIcon name={item.key} className="h-3.5 w-3.5" />
                        </span>
                      ))}
                      {card.extraCount > 0 && (
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-cloud px-1.5 text-xs font-medium text-graphite">
                          +{card.extraCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <span className="link-blue inline-flex items-center gap-1 text-sm font-medium">
                Lihat &amp; Tempah
                <svg
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
