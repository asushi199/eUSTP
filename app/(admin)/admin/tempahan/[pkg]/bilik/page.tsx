import Link from "next/link";
import { notFound } from "next/navigation";
import RoomAdminList from "@/components/tempahan/RoomAdminList";
import RoomForm from "@/components/tempahan/RoomForm";
import { requireTempahanAccess } from "@/lib/rbac";
import { getPkg, listRooms } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  await requireTempahanAccess(pkgId);

  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const rooms = await listRooms(pkgId, true);

  return (
    <>
      <Link href={`/admin/tempahan/${pkgId}`} className="text-sm text-graphite hover:text-ink">
        ← {pkg.name}
      </Link>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Urus Bilik</h1>
      <p className="mt-1 text-sm text-graphite">
        Sembunyi = soft delete; rekod tempahan lama kekal.
      </p>

      <div className="mt-6">
        <RoomAdminList
          pkgId={pkgId}
          rooms={rooms.map((r) => ({
            slug: r.slug,
            name: r.name,
            shortName: r.shortName,
            category: r.category,
            capacity: r.capacity,
            amenities: r.amenities,
            sortOrder: r.sortOrder,
            active: r.active,
            imageSrc: r.imageSrc,
          }))}
        />
      </div>

      <div className="mt-8 max-w-xl">
        <RoomForm pkgId={pkgId} />
      </div>
    </>
  );
}
