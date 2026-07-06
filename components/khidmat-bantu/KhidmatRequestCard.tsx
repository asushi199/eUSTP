import AdminKhidmatActions from "@/components/khidmat-bantu/AdminKhidmatActions";
import {
  getApplicantTypeLabel,
  getServiceTypeLabel,
} from "@/lib/khidmat-bantu/config";
import {
  getServiceDate,
  getServiceLokasi,
  getServiceTime,
  getServiceTitle,
  getSuratPermohonan,
} from "@/lib/khidmat-bantu/date-group";
import { formatBookingStatus } from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import { suratPermohonanViewUrl } from "@/lib/khidmat-bantu/surat-storage";
import { cn } from "@/lib/cn";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";

const STATUS_DOT: Record<string, string> = {
  pending: "bg-graphite",
  approved: "bg-primary",
  rejected: "bg-bloom-deep",
  cancelled: "bg-steel",
};

/**
 * Kad ringkas satu permohonan. `bare` guna sempadan nipis (untuk item dalam
 * senarai/kalendar terkumpul); default penuh `.card` (untuk gilir tindakan).
 * Butang tindakan hanya muncul apabila status pending.
 */
export default function KhidmatRequestCard({
  row,
  bare = false,
  showDate = true,
}: {
  row: KhidmatBantuRow;
  bare?: boolean;
  showDate?: boolean;
}) {
  const date = getServiceDate(row);
  const surat = getSuratPermohonan(row);
  const suratUrl = surat ? suratPermohonanViewUrl(surat.storagePath) : null;
  const meta = [
    showDate && date ? formatMalayDate(date) : null,
    getServiceTime(row) || null,
    getServiceLokasi(row) || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn(bare ? "rounded-lg border border-fog/70 bg-white p-4" : "card p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-graphite">
            {getServiceTypeLabel(row.serviceType)} · {getApplicantTypeLabel(row.applicantType)}
          </p>
          <p className="mt-0.5 font-semibold leading-snug">{getServiceTitle(row)}</p>
        </div>
        <span className="status-badge shrink-0">
          <span className={cn("status-dot", STATUS_DOT[row.status] ?? "bg-graphite")} />
          {formatBookingStatus(row.status)}
        </span>
      </div>

      {meta && <p className="mt-2 text-sm text-graphite">{meta}</p>}

      <p className="mt-1 text-sm">
        <span className="font-medium">{row.applicantName}</span>
        <span className="text-graphite">
          {" · "}
          {row.orgName} · {row.contact}
        </span>
      </p>

      {suratUrl && (
        <p className="mt-2">
          <a href={suratUrl} className="link-blue text-xs" target="_blank" rel="noopener noreferrer">
            Surat permohonan
          </a>
        </p>
      )}

      {row.status === "pending" && (
        <div className="mt-3">
          <AdminKhidmatActions requestId={row.id} status={row.status} />
        </div>
      )}
    </div>
  );
}
