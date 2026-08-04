import { notFound } from "next/navigation";
import CetakKehadiranPoster from "@/components/tempahan/CetakKehadiranPoster";
import { formatSlotTimeRange } from "@/lib/tempahan/booking-rules";
import { formatDayNameLong, fromIsoDate } from "@/lib/tempahan/date";
import {
  getBookingByCetakToken,
  getPkg,
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

  const room = await getRoomBySlug(pkgId, booking.roomSlug);
  const duration =
    booking.slot === "full_day"
      ? "1 HARI"
      : booking.slot === "am"
        ? "PAGI"
        : "PETANG";
  const dateLine = `${formatPosterDate(booking.date)} - ${duration}`;
  const locationLine = [room?.name ?? booking.roomSlug, pkg.name]
    .filter(Boolean)
    .join(" / ");

  return (
    <CetakKehadiranPoster
      title="Pendaftaran Kehadiran Peserta"
      programName={booking.purpose}
      dateLine={dateLine}
      timeLine={formatSlotTimeRange(booking.slot)}
      locationLine={locationLine}
      qrUrl={booking.autosijilPublicUrl}
      requiresCertificate={booking.requiresCertificate}
      logoSrc="/ustp-logo.png"
    />
  );
}
