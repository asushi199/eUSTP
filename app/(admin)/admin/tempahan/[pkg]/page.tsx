import Link from "next/link";
import { notFound } from "next/navigation";
import AdminBookingActions from "@/components/tempahan/AdminBookingActions";
import { requireTempahanAccess } from "@/lib/rbac";
import { formatSlot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate, toIsoDate } from "@/lib/tempahan/date";
import { getPkg, listAdminBookings, listRooms } from "@/lib/tempahan/queries";
import type { BookingRow } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

function BookingTable({
  pkgId,
  rows,
  roomNames,
  emptyText,
}: {
  pkgId: string;
  rows: BookingRow[];
  roomNames: Record<string, string>;
  emptyText: string;
}) {
  return (
    <div className="card mt-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
            <th className="px-4 py-3 font-semibold">Tarikh</th>
            <th className="px-4 py-3 font-semibold">Bilik</th>
            <th className="px-4 py-3 font-semibold">Slot</th>
            <th className="px-4 py-3 font-semibold">Pemohon</th>
            <th className="px-4 py-3 font-semibold">Tujuan</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-graphite">
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((b) => (
            <tr key={b.id} className="border-b hairline align-top last:border-0">
              <td className="px-4 py-3 whitespace-nowrap">{formatMalayDate(b.date)}</td>
              <td className="px-4 py-3">{roomNames[b.roomSlug] ?? b.roomSlug}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatSlot(b.slot)}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-graphite">
                  {b.schoolOrUnit} · {b.contact}
                </p>
              </td>
              <td className="px-4 py-3">
                {b.purpose}
                {b.status === "approved" && b.attendanceManageToken && (
                  <p className="mt-1">
                    <Link
                      href={`/tempahan/${pkgId}/urus-hadir/${b.attendanceManageToken}`}
                      className="link-blue text-xs"
                    >
                      Urus kehadiran / QR
                    </Link>
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <AdminBookingActions pkgId={pkgId} bookingId={b.id} status={b.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPkgTempahanPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  await requireTempahanAccess(pkgId);

  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const today = toIsoDate(new Date());
  const [{ pending, upcoming }, rooms] = await Promise.all([
    listAdminBookings(pkgId, today),
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

      <section className="mt-6">
        <h2 className="text-lg font-semibold">
          Menunggu Kelulusan ({pending.length})
        </h2>
        <BookingTable
          pkgId={pkgId}
          rows={pending}
          roomNames={roomNames}
          emptyText="Tiada permohonan menunggu."
        />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Akan Datang (Diluluskan)</h2>
        <BookingTable
          pkgId={pkgId}
          rows={upcoming}
          roomNames={roomNames}
          emptyText="Tiada tempahan akan datang."
        />
      </section>
    </>
  );
}
