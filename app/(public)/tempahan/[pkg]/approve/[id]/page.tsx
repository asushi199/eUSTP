import { notFound } from "next/navigation";
import WhatsAppPemohonLink from "@/components/admin/WhatsAppPemohonLink";
import { approveByTokenAction } from "@/lib/actions/tempahan";
import { verifyApprovalToken } from "@/lib/tempahan/approval-token";
import { formatBookingStatus, formatSlot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { getBooking, getPkg, getRoomBySlug } from "@/lib/tempahan/queries";
import { buildBookingDecisionWhatsAppUrl } from "@/lib/tempahan/whatsapp";

export const dynamic = "force-dynamic";

export default async function ApproveBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { pkg: pkgId, id } = await params;
  const { token = "" } = await searchParams;

  const [pkg, booking] = await Promise.all([getPkg(pkgId), getBooking(pkgId, id)]);
  if (!pkg || !booking) notFound();

  const tokenValid = await verifyApprovalToken(booking.id, token, booking.approvalTokenHash);
  if (!tokenValid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
        <h1 className="text-2xl font-semibold">Pautan tidak sah</h1>
        <p className="mt-2 text-graphite">
          Pautan kelulusan ini tidak sah atau telah tamat. Sila gunakan panel
          admin untuk mengurus tempahan.
        </p>
      </div>
    );
  }

  const room = await getRoomBySlug(pkgId, booking.roomSlug);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Kelulusan Tempahan</h1>
      <p className="mt-1 text-sm text-graphite">{pkg.name}</p>

      <div className="card mt-6 p-6">
        <table className="w-full text-sm">
          <tbody>
            {(
              [
                ["Pemohon", booking.name],
                ["Sekolah / Unit", booking.schoolOrUnit],
                ["Bilik", room?.name ?? booking.roomSlug],
                ["Tarikh", formatMalayDate(booking.date)],
                ["Slot", formatSlot(booking.slot)],
                ["Tujuan", booking.purpose],
                ["Telefon", booking.contact],
                ["Status", formatBookingStatus(booking.status)],
              ] as const
            ).map(([label, value]) => (
              <tr key={label} className="border-b hairline last:border-0">
                <td className="w-36 py-2.5 pr-3 align-top font-semibold">{label}</td>
                <td className="py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {booking.status === "pending" ? (
        <form action={approveByTokenAction} className="mt-6 space-y-4">
          <input type="hidden" name="pkg" value={pkgId} />
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="token" value={token} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="requiresCertificate" />
            Perlu sijil untuk peserta
          </label>
          <div className="flex gap-3">
            <button type="submit" name="decision" value="approve" className="btn-primary flex-1">
              Luluskan
            </button>
            <button type="submit" name="decision" value="reject" className="btn-outline-ink flex-1">
              Tolak
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="rounded-md bg-cloud px-4 py-3 text-sm text-graphite">
            Tempahan ini telah diproses ({formatBookingStatus(booking.status)}).
          </p>
          {(booking.status === "approved" || booking.status === "rejected") && (
            <WhatsAppPemohonLink
              href={buildBookingDecisionWhatsAppUrl(booking.contact, {
                name: booking.name,
                room: room?.name ?? booking.roomSlug,
                purpose: booking.purpose,
                date: formatMalayDate(booking.date),
                slot: formatSlot(booking.slot),
                decision: booking.status,
              })}
              className="btn-primary"
            />
          )}
        </div>
      )}
      <p className="mt-3 text-xs text-graphite">
        Anda perlu log masuk sebagai pentadbir untuk meluluskan.
      </p>
    </div>
  );
}
