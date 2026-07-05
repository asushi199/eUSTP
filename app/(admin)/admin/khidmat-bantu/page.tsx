import Link from "next/link";
import AdminKhidmatActions from "@/components/khidmat-bantu/AdminKhidmatActions";
import {
  getApplicantTypeLabel,
  getServiceTypeLabel,
  isMcpService,
  isProgramService,
} from "@/lib/khidmat-bantu/config";
import { listAdminKhidmatBantuRequests } from "@/lib/khidmat-bantu/queries";
import { requireKandunganAccess } from "@/lib/rbac";
import { formatBookingStatus } from "@/lib/tempahan/booking-rules";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";
import type { KhidmatMcpDetails, KhidmatProgramDetails } from "@/lib/schema";

export const dynamic = "force-dynamic";

function requestSummary(row: KhidmatBantuRow): string {
  const d = row.details;
  if (isProgramService(row.serviceType)) {
    const p = d as KhidmatProgramDetails;
    return `${p.tajuk} · ${p.tarikhCadangan} · ${p.lokasi}`;
  }
  const m = d as KhidmatMcpDetails;
  return `${m.tajukProgram} · ${m.tarikh} · ${m.lokasi}`;
}

function RequestTable({
  rows,
  emptyText,
}: {
  rows: KhidmatBantuRow[];
  emptyText: string;
}) {
  return (
    <div className="card mt-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
            <th className="px-4 py-3 font-semibold">Tarikh mohon</th>
            <th className="px-4 py-3 font-semibold">Perkhidmatan</th>
            <th className="px-4 py-3 font-semibold">Pemohon</th>
            <th className="px-4 py-3 font-semibold">Ringkasan</th>
            <th className="px-4 py-3 font-semibold">Status</th>
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
          {rows.map((r) => (
            <tr key={r.id} className="border-b hairline align-top last:border-0">
              <td className="px-4 py-3 whitespace-nowrap">
                {r.createdAt.toLocaleDateString("ms-MY")}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{getServiceTypeLabel(r.serviceType)}</p>
                <p className="text-xs text-graphite">
                  {getApplicantTypeLabel(r.applicantType)}
                </p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{r.applicantName}</p>
                <p className="text-xs text-graphite">
                  {r.orgName} · {r.contact}
                </p>
              </td>
              <td className="px-4 py-3 max-w-xs">
                {requestSummary(r)}
                {isMcpService(r.serviceType) && (
                  <p className="mt-1 text-xs text-graphite">
                    {(r.details as KhidmatMcpDetails).platform &&
                      `Platform: ${(r.details as KhidmatMcpDetails).platform}`}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatBookingStatus(r.status)}
              </td>
              <td className="px-4 py-3">
                <AdminKhidmatActions requestId={r.id} status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminKhidmatBantuPage() {
  await requireKandunganAccess();
  const { pending, others, dbNotReady } = await listAdminKhidmatBantuRequests();

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin" className="text-sm text-graphite hover:text-ink">
            ← Admin
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Permohonan Khidmat Bantu
          </h1>
        </div>
        <Link href="/admin/khidmat-bantu/tetapan" className="btn-outline-ink btn-sm">
          Tetapan WhatsApp
        </Link>
      </div>

      {dbNotReady ? (
        <div className="card mt-6 border-amber-200 bg-amber-50/80 p-6 text-sm leading-relaxed text-graphite">
          <p className="font-semibold text-ink">Jadual pangkalan data belum sedia</p>
          <p className="mt-2">
            Modul Khidmat Bantu memerlukan migrasi <code className="text-xs">0006_khidmat_bantu</code>.
            Jalankan <code className="text-xs">npm run db:migrate</code> pada pangkalan data
            production (Supabase / Vercel Postgres), kemudian muat semula halaman ini.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-lg font-semibold">Menunggu Kelulusan ({pending.length})</h2>
            <RequestTable rows={pending} emptyText="Tiada permohonan menunggu." />
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Sejarah Permohonan</h2>
            <RequestTable rows={others} emptyText="Tiada rekod permohonan." />
          </section>
        </>
      )}
    </>
  );
}
