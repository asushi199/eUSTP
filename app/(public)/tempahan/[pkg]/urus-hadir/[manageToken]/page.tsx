import Link from "next/link";
import { notFound } from "next/navigation";
import QrCode from "@/components/tempahan/QrCode";
import { formatSlot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import {
  getBookingByManageToken,
  getPkg,
  getRoomBySlug,
  listAttendees,
} from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function UrusHadirPage({
  params,
}: {
  params: Promise<{ pkg: string; manageToken: string }>;
}) {
  const { pkg: pkgId, manageToken } = await params;
  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const booking = await getBookingByManageToken(pkgId, manageToken);
  if (!booking) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
        <h1 className="text-2xl font-semibold">Pautan tidak sah</h1>
        <p className="mt-2 text-graphite">Pautan pengurusan kehadiran ini tidak sah.</p>
      </div>
    );
  }

  const [room, attendees] = await Promise.all([
    getRoomBySlug(pkgId, booking.roomSlug),
    listAttendees(pkgId, booking.id),
  ]);

  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "";
  const hadirPath = `/tempahan/${pkgId}/hadir/${booking.attendanceToken}`;
  const hadirUrl = `${baseUrl}${hadirPath}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Urus Kehadiran</h1>
      <div className="card-cloud mt-4 p-4 text-sm">
        <p className="font-semibold">{booking.purpose}</p>
        <p className="mt-1 text-graphite">
          {room?.name ?? booking.roomSlug} · {formatMalayDate(booking.date)} ·{" "}
          {formatSlot(booking.slot)} · {pkg.name}
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[auto,1fr]">
        <div className="card flex flex-col items-center gap-3 p-6 no-print">
          <QrCode value={hadirUrl || hadirPath} />
          <p className="text-center text-xs text-graphite">
            Imbas untuk daftar kehadiran
            <br />
            <Link href={hadirPath} className="link-blue">
              Pautan pendaftaran
            </Link>
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Senarai Kehadiran ({attendees.length})
            </h2>
            <a
              href={`/tempahan/${pkgId}/urus-hadir/${manageToken}/export`}
              className="btn-outline-ink btn-sm no-print"
            >
              Muat Turun CSV
            </a>
          </div>
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Telefon / Emel</th>
                  <th className="px-4 py-3 font-semibold">Masa</th>
                </tr>
              </thead>
              <tbody>
                {attendees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-graphite">
                      Belum ada kehadiran direkodkan.
                    </td>
                  </tr>
                )}
                {attendees.map((a, i) => (
                  <tr key={a.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-3 text-graphite">{i + 1}</td>
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3">{a.contact}</td>
                    <td className="px-4 py-3 text-graphite">
                      {a.createdAt.toLocaleTimeString("ms-MY", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
