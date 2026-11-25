import { STATUS_LABEL } from "@/lib/kunjung-bantu/instrumen";

type StatusPapar = keyof typeof STATUS_LABEL;

const WARNA_TITIK: Record<StatusPapar, string> = {
  BELUM: "bg-steel",
  DRAF: "bg-steel",
  DIHANTAR: "bg-graphite",
  PERLU_PEMBETULAN: "bg-bloom-deep",
  DISAHKAN: "bg-primary",
};

/** Lencana status (pending=graphite, disahkan=primary, pembetulan=bloom-deep). */
export default function StatusLencana({ status }: { status: StatusPapar }) {
  return (
    <span className="status-badge">
      <span className={`status-dot ${WARNA_TITIK[status]}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
