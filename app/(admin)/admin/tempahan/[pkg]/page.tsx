import Link from "next/link";
import { notFound } from "next/navigation";
import TempahanAdminView from "@/components/tempahan/TempahanAdminView";
import { requireTempahanAccess } from "@/lib/rbac";
import { parseBulan, todayParts } from "@/lib/month-view";
import {
  getPkg,
  listPendingBookings,
  listPkgMonthBookings,
  listRooms,
} from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function AdminPkgTempahanPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string }>;
  searchParams: Promise<{ bulan?: string; view?: string }>;
}) {
  const { pkg: pkgId } = await params;
  const { bulan, view } = await searchParams;
  await requireTempahanAccess(pkgId);

  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const { year, month } = parseBulan(bulan) ?? todayParts();

  const [pending, monthBookings, rooms] = await Promise.all([
    listPendingBookings(pkgId),
    listPkgMonthBookings(pkgId, year, month),
    listRooms(pkgId, true),
  ]);
  const roomNames = Object.fromEntries(rooms.map((r) => [r.slug, r.name]));

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/tempahan" className="text-sm text-graphite hover:text-ink">
            ← Semua PKG
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{pkg.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/tempahan/${pkgId}/bilik`} className="btn-outline-ink btn-sm">
            Urus Bilik
          </Link>
          <Link href={`/admin/tempahan/${pkgId}/tetapan`} className="btn-outline-ink btn-sm">
            Tetapan
          </Link>
        </div>
      </div>

      <TempahanAdminView
        pkgId={pkgId}
        pending={pending}
        monthBookings={monthBookings}
        roomNames={roomNames}
        year={year}
        month={month}
        initialView={view === "senarai" ? "senarai" : "kalendar"}
      />
    </>
  );
}
