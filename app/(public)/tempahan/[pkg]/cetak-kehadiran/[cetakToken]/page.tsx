import { notFound } from "next/navigation";
import CetakKehadiranPoster from "@/components/tempahan/CetakKehadiranPoster";
import { formatSlotTimeRange } from "@/lib/tempahan/booking-rules";
import { formatDayNameLong, fromIsoDate } from "@/lib/tempahan/date";
import {
  getBookingByCetakToken,
  getPkg,
  listBookingGroup,
  getRoomBySlug,
} from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

function formatPosterDate(iso: string) {
  const d = fromIsoDate(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy} (${formatDayNameLong(iso)})`;
}

export default async function CetakKehadiranPage({
  params,
}: {
  params: Promise<{ pkg: string; cetakToken: string }>;
}) {
  const { pkg: pkgId, cetakToken } = await params;
  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const booking = await getBookingByCetakToken(pkgId, cetakToken);
  if (!booking || booking.status !== "approved" || !booking.autosijilPublicUrl) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
        <h1 className="text-2xl font-semibold">Pautan cetak tidak sah</h1>
        <p className="mt-2 text-graphite">
          Poster kehadiran belum tersedia. Pastikan tempahan telah diluluskan dan
          disegerakkan dengan Autosijil.
        </p>
      </div>
    );
  }

  const [room, group] = await Promise.all([
    getRoomBySlug(pkgId, booking.roomSlug),
    booking.groupId ? listBookingGroup(pkgId, booking.groupId) : Promise.resolve([booking]),
  ]);
  const schedule = group.filter((row) => row.status === "approved");
  const duration =
    booking.slot === "full_day"
      ? "1 HARI"
      : booking.slot === "am"
        ? "PAGI"
        : "PETANG";
  const dateLine =
    schedule.length > 1
      ? `${formatPosterDate(schedule[0]!.date)} HINGGA ${formatPosterDate(schedule.at(-1)!.date)} - ${schedule.length} HARI`
      : `${formatPosterDate(booking.date)} - ${duration}`;
  const scheduleLines =
    schedule.length > 1
      ? schedule.map((row) => `${formatPosterDate(row.date)} · ${formatSlotTimeRange(row.slot)}`)
      : undefined;
  const locationLine = [room?.name ?? booking.roomSlug, pkg.name]
    .filter(Boolean)
    .join(" / ");

  return (
    <CetakKehadiranPoster
      title="Pendaftaran Kehadiran Peserta"
      programName={booking.purpose}
      dateLine={dateLine}
      timeLine={formatSlotTimeRange(booking.slot)}
      scheduleLines={scheduleLines}
      locationLine={locationLine}
      qrUrl={booking.autosijilPublicUrl}
      requiresCertificate={booking.requiresCertificate}
      logoSrc="/nexa-logo.png"
    />
  );
}
