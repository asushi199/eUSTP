import Link from "next/link";
import WhatsAppPemohonLink from "@/components/admin/WhatsAppPemohonLink";
import { getServiceTypeLabel } from "@/lib/khidmat-bantu/config";
import { getServiceDate, getServiceTitle } from "@/lib/khidmat-bantu/date-group";
import { getKhidmatBantuRequest } from "@/lib/khidmat-bantu/queries";
import { buildKhidmatDecisionWhatsAppUrl } from "@/lib/khidmat-bantu/whatsapp";
import { getSessionUser } from "@/lib/rbac";
import { canManageKandungan } from "@/lib/roles";
import { formatMalayDate } from "@/lib/tempahan/date";

const MESSAGES: Record<string, { title: string; body: string }> = {
  approved: {
    title: "Permohonan diluluskan ✓",
    body: "Status permohonan khidmat bantu telah dikemas kini.",
  },
  rejected: {
    title: "Permohonan ditolak",
    body: "Status permohonan telah dikemas kini.",
  },
  processed: {
    title: "Sudah diproses",
    body: "Permohonan ini telah diproses sebelum ini.",
  },
  unauthorized: {
    title: "Tiada kebenaran",
    body: "Akaun anda tidak mempunyai akses pentadbir USTP.",
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

async function getDecisionWhatsappUrl(requestId: string | undefined) {
  if (!requestId) return "";
  const user = await getSessionUser();
  if (!user || !canManageKandungan(user.peranan)) return "";

  const request = await getKhidmatBantuRequest(requestId);
  if (!request || (request.status !== "approved" && request.status !== "rejected")) {
    return "";
  }

  const date = getServiceDate(request);
  return buildKhidmatDecisionWhatsAppUrl(request.contact, {
    applicantName: request.applicantName,
    orgName: request.orgName,
    serviceLabel: getServiceTypeLabel(request.serviceType),
    title: getServiceTitle(request),
    date: date ? formatMalayDate(date) : "—",
    decision: request.status,
  });
}

export default async function KhidmatApproveResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; id?: string }>;
}) {
  const { status = "invalid", id } = await searchParams;
  const msg = MESSAGES[status] ?? MESSAGES.invalid;
  const whatsappUrl =
    status === "approved" || status === "rejected" || status === "processed"
      ? await getDecisionWhatsappUrl(id)
      : "";

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
      <h1 className="text-2xl font-semibold">{msg.title}</h1>
      <p className="mt-2 text-graphite">{msg.body}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {whatsappUrl ? <WhatsAppPemohonLink href={whatsappUrl} className="btn-primary" /> : null}
        <Link href="/admin/khidmat-bantu" className={whatsappUrl ? "btn-outline-ink" : "btn-primary"}>
          Panel Admin
        </Link>
        <Link href="/khidmat-bantu" className="btn-outline-ink">
          Halaman Permohonan
        </Link>
      </div>
    </div>
  );
}
