import { notFound } from "next/navigation";
import { approveKhidmatByTokenAction } from "@/lib/actions/khidmat-bantu";
import {
  getApplicantTypeLabel,
  getServiceTypeLabel,
  isMcpService,
  isProgramService,
} from "@/lib/khidmat-bantu/config";
import { getKhidmatBantuRequest } from "@/lib/khidmat-bantu/queries";
import { formatBookingStatus } from "@/lib/tempahan/booking-rules";
import { verifyApprovalToken } from "@/lib/tempahan/approval-token";
import type { KhidmatMcpDetails, KhidmatProgramDetails } from "@/lib/schema";

export const dynamic = "force-dynamic";

function formatDetails(serviceType: string, details: KhidmatProgramDetails | KhidmatMcpDetails) {
  if (isProgramService(serviceType)) {
    const d = details as KhidmatProgramDetails;
    return [
      ["Tajuk", d.tajuk],
      ["Tarikh cadangan", d.tarikhCadangan],
      ["Masa cadangan", d.masaCadangan],
      ["Lokasi", d.lokasi],
      ["Bil. peserta", d.bilPeserta || "—"],
      ["Catatan", d.catatan || "—"],
    ] as const;
  }
  const d = details as KhidmatMcpDetails;
  return [
    ["Tajuk program", d.tajukProgram],
    ["Tarikh", d.tarikh],
    ["Masa", d.masa],
    ["Lokasi", d.lokasi],
    ["Platform", d.platform || "—"],
    ["Catatan teknikal", d.catatanTeknikal || "—"],
  ] as const;
}

export default async function ApproveKhidmatBantuPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token = "" } = await searchParams;

  const request = await getKhidmatBantuRequest(id);
  if (!request) notFound();

  const tokenValid = await verifyApprovalToken(
    request.id,
    token,
    request.approvalTokenHash,
  );
  if (!tokenValid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
        <h1 className="text-2xl font-semibold">Pautan tidak sah</h1>
        <p className="mt-2 text-graphite">
          Pautan kelulusan ini tidak sah atau telah tamat. Sila gunakan panel admin
          untuk mengurus permohonan.
        </p>
      </div>
    );
  }

  const detailRows = formatDetails(request.serviceType, request.details);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Kelulusan Khidmat Bantu</h1>
      <p className="mt-1 text-sm text-graphite">Permohonan USTP PPD Manjung</p>

      <div className="card mt-6 p-6">
        <table className="w-full text-sm">
          <tbody>
            {(
              [
                ["Pemohon", request.applicantName],
                ["Unit", request.orgName],
                ["Jenis pemohon", getApplicantTypeLabel(request.applicantType)],
                ["Perkhidmatan", getServiceTypeLabel(request.serviceType)],
                ["Telefon", request.contact],
                ["Emel", request.email || "—"],
                ["Status", formatBookingStatus(request.status)],
              ] as const
            ).map(([label, value]) => (
              <tr key={label} className="border-b hairline last:border-0">
                <td className="w-40 py-2.5 pr-3 align-top font-semibold">{label}</td>
                <td className="py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-4 p-6">
        <h2 className="text-sm font-semibold text-ink">
          {isMcpService(request.serviceType) ? "Butiran MCP" : "Butiran Program"}
        </h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {detailRows.map(([label, value]) => (
              <tr key={label} className="border-b hairline last:border-0">
                <td className="w-40 py-2.5 pr-3 align-top font-semibold">{label}</td>
                <td className="py-2.5">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {request.status === "pending" ? (
        <form action={approveKhidmatByTokenAction} className="mt-6 flex gap-3">
          <input type="hidden" name="requestId" value={request.id} />
          <input type="hidden" name="token" value={token} />
          <button type="submit" name="decision" value="approve" className="btn-primary flex-1">
            Luluskan
          </button>
          <button type="submit" name="decision" value="reject" className="btn-outline-ink flex-1">
            Tolak
          </button>
        </form>
      ) : (
        <p className="mt-6 rounded-md bg-cloud px-4 py-3 text-sm text-graphite">
          Permohonan ini telah diproses ({formatBookingStatus(request.status)}).
        </p>
      )}
      <p className="mt-3 text-xs text-graphite">
        Anda perlu log masuk sebagai pentadbir USTP untuk meluluskan.
      </p>
    </div>
  );
}
