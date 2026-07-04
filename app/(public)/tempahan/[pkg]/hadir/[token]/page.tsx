import { notFound } from "next/navigation";
import AttendanceForm from "@/components/tempahan/AttendanceForm";
import { formatSlot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { getBookingByAttendanceToken, getPkg, getRoomBySlug } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function HadirPage({
  params,
}: {
  params: Promise<{ pkg: string; token: string }>;
}) {
  const { pkg: pkgId, token } = await params;
  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const booking = await getBookingByAttendanceToken(pkgId, token);
  if (!booking || booking.status !== "approved") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
        <h1 className="text-2xl font-semibold">Pautan tidak sah</h1>
        <p className="mt-2 text-graphite">
          Pautan kehadiran ini tidak sah atau tempahan belum diluluskan.
        </p>
      </div>
    );
  }

  const room = await getRoomBySlug(pkgId, booking.roomSlug);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Daftar Kehadiran</h1>
      <div className="card-cloud mt-4 p-4 text-sm">
        <p className="font-semibold">{booking.purpose}</p>
        <p className="mt-1 text-graphite">
          {room?.name ?? booking.roomSlug} · {formatMalayDate(booking.date)} ·{" "}
          {formatSlot(booking.slot)} · {pkg.name}
        </p>
      </div>
      <div className="mt-6">
        <AttendanceForm pkgId={pkgId} token={token} />
      </div>
    </div>
  );
}
