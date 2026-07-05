import Link from "next/link";
import { notFound } from "next/navigation";
import RoomGallery from "@/components/tempahan/RoomGallery";
import { getPkg, listRooms } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function PkgTempahanPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const rooms = await listRooms(pkgId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/tempahan/bilik" className="text-sm text-graphite hover:text-ink">
            ← Semua PKG
          </Link>
          <div className="mt-2 flex items-center gap-3">
            {pkg.logoSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pkg.logoSrc}
                alt=""
                className="h-12 w-12 rounded-lg border border-fog bg-white object-contain"
              />
            )}
            <h1 className="text-3xl font-medium tracking-tight">{pkg.name}</h1>
          </div>
          <p className="mt-1 max-w-xl text-graphite">
            Pilih bilik di bawah untuk melihat gambar, kemudahan dan status slot, kemudian hantar
            permohonan untuk kelulusan admin.
          </p>
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
          <RoomGallery
            pkgId={pkgId}
            rooms={rooms.map((r) => ({
              slug: r.slug,
              name: r.name,
              category: r.category,
              capacity: r.capacity,
              imageSrc: r.imageSrc,
              amenities: r.amenities,
            }))}
          />
        )}
      </div>
    </div>
  );
}
