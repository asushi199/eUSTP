import Link from "next/link";
import WhatsAppPemohonLink from "@/components/admin/WhatsAppPemohonLink";
import { getSessionUser } from "@/lib/rbac";
import { canManageTempahan } from "@/lib/roles";
import { formatSlot } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { getBooking, getRoomBySlug } from "@/lib/tempahan/queries";
import { buildBookingDecisionWhatsAppUrl } from "@/lib/tempahan/whatsapp";

const MESSAGES: Record<string, { title: string; body: string }> = {
  approved: {
    title: "Tempahan diluluskan ✓",
    body: "Pemohon boleh menyemak status dan mengurus kehadiran (pautan + QR) melalui halaman Semak Tempahan.",
  },
  rejected: {
    title: "Tempahan ditolak",
    body: "Status tempahan telah dikemas kini.",
  },
  processed: {
    title: "Sudah diproses",
    body: "Tempahan ini telah diproses sebelum ini.",
  },
  unauthorized: {
    title: "Tiada kebenaran",
    body: "Akaun anda tidak mempunyai akses kepada PKG ini.",
  },
  invalid: {
    title: "Pautan tidak sah",
    body: "Pautan kelulusan tidak sah atau telah tamat.",
  },
  error: {
    title: "Ralat",
    body: "Tindakan tidak berjaya. Sila cuba lagi di panel admin.",
  },
};

async function getDecisionWhatsappUrl(pkgId: string, bookingId: string | undefined) {
  if (!bookingId) return "";
  const user = await getSessionUser();
  if (!user || !canManageTempahan(user.peranan)) return "";
  if (user.peranan === "PKG_Admin" && user.pkgId !== pkgId) return "";

  const booking = await getBooking(pkgId, bookingId);
  if (!booking || (booking.status !== "approved" && booking.status !== "rejected")) {
    return "";
  }

  const room = await getRoomBySlug(pkgId, booking.roomSlug);
  return buildBookingDecisionWhatsAppUrl(booking.contact, {
    name: booking.name,
    room: room?.name ?? booking.roomSlug,
    purpose: booking.purpose,
    date: formatMalayDate(booking.date),
    slot: formatSlot(booking.slot),
    decision: booking.status,
  });
}

export default async function ApproveResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string }>;
  searchParams: Promise<{ status?: string; id?: string }>;
}) {
  const { pkg: pkgId } = await params;
  const { status = "invalid", id } = await searchParams;
  const msg = MESSAGES[status] ?? MESSAGES.invalid;
  const whatsappUrl =
    status === "approved" || status === "rejected" || status === "processed"
      ? await getDecisionWhatsappUrl(pkgId, id)
      : "";

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
      <h1 className="text-2xl font-semibold">{msg.title}</h1>
      <p className="mt-2 text-graphite">{msg.body}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {whatsappUrl ? <WhatsAppPemohonLink href={whatsappUrl} className="btn-primary" /> : null}
        <Link href={`/admin/tempahan/${pkgId}`} className={whatsappUrl ? "btn-outline-ink" : "btn-primary"}>
          Panel Admin
        </Link>
        <Link href={`/tempahan/${pkgId}`} className="btn-outline-ink">
          Halaman Tempahan
        </Link>
      </div>
    </div>
  );
}
