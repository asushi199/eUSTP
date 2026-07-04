import Link from "next/link";
import { notFound } from "next/navigation";
import { getPkg, getRoomBySlug } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ pkg: string; slug: string }>;
}) {
  const { pkg: pkgId, slug } = await params;
  const [pkg, room] = await Promise.all([getPkg(pkgId), getRoomBySlug(pkgId, slug)]);
  if (!pkg || !room || !room.active) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <Link href={`/tempahan/${pkgId}`} className="text-sm text-graphite hover:text-ink">
        ← {pkg.name}
      </Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">{room.name}</h1>
      {room.category && <p className="mt-1 text-graphite">{room.category}</p>}

      {room.imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={room.imageSrc}
          alt={room.name}
          className="mt-6 max-h-96 w-full rounded-xl border hairline object-cover"
        />
      )}

      {room.amenities.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold">Kemudahan</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {room.amenities.map((a) => (
              <li key={a} className="status-badge">
                {a}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href={`/tempahan/${pkgId}`} className="btn-primary mt-8 inline-flex">
        Tempah Bilik Ini
      </Link>
    </div>
  );
}
