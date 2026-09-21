"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotifyPemohon } from "@/components/admin/NotifyPemohonProvider";
import WhatsAppPemohonLink from "@/components/admin/WhatsAppPemohonLink";
import {
  adminApproveKhidmat,
  adminDeleteKhidmat,
  adminRejectKhidmat,
  adminUpdateKhidmat,
} from "@/lib/actions/khidmat-bantu-admin";
import {
  canDeleteKhidmatFromAdmin,
  canEditKhidmatFromAdmin,
} from "@/lib/khidmat-bantu/admin";
import {
  SERVICE_TYPES,
  getServiceTypeLabel,
} from "@/lib/khidmat-bantu/config";
import { buildKhidmatDecisionWhatsAppUrl } from "@/lib/khidmat-bantu/whatsapp";
import type { BookingStatus } from "@/lib/tempahan/booking-rules";

type KhidmatWhatsAppDetails = {
  applicantName: string;
  orgName: string;
  serviceLabel: string;
  title: string;
  date: string;
};

export default function AdminKhidmatActions({
  requestId,
  status,
  applicantPhone = "",
  whatsappDetails,
  serviceType,
  title,
  activityDate,
  activityTime,
  lokasi,
}: {
  requestId: string;
  status: BookingStatus;
  applicantPhone?: string;
  whatsappDetails?: KhidmatWhatsAppDetails;
  serviceType: string;
  title: string;
  activityDate: string;
  activityTime: string;
  lokasi: string;
}) {
  const router = useRouter();
  const { promptNotifyPemohon } = useNotifyPemohon();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editServiceType, setEditServiceType] = useState(serviceType);
  const [editTitle, setEditTitle] = useState(title);
  const [editDate, setEditDate] = useState(activityDate);
  const [editTime, setEditTime] = useState(activityTime);
  const [editLokasi, setEditLokasi] = useState(lokasi);

  const serviceOptions = SERVICE_TYPES.some((s) => s.id === serviceType)
    ? SERVICE_TYPES
    : [{ id: serviceType, label: getServiceTypeLabel(serviceType) }, ...SERVICE_TYPES];

  function decisionUrl(decision: "approved" | "rejected") {
    if (!whatsappDetails) return "";
    return buildKhidmatDecisionWhatsAppUrl(applicantPhone, {
      ...whatsappDetails,
      decision,
    });
  }

  const decisionWhatsappUrl =
    status === "approved" || status === "rejected" ? decisionUrl(status) : "";

  function resetEditForm() {
    setEditServiceType(serviceType);
    setEditTitle(title);
    setEditDate(activityDate);
    setEditTime(activityTime);
    setEditLokasi(lokasi);
  }

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    confirmMsg?: string,
    notifyDecision?: "approved" | "rejected",
  ) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "Tindakan gagal.");
        return;
      }
      if (notifyDecision) {
        const prompt = {
          href: decisionUrl(notifyDecision),
          decision: notifyDecision,
        };
        window.setTimeout(() => promptNotifyPemohon(prompt), 0);
      }
      router.refresh();
    });
  }

  function saveActivity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("serviceType", editServiceType);
    fd.set("tajukProgram", editTitle);
    fd.set("activityDate", editDate);
    fd.set("activityTime", editTime);
    fd.set("lokasi", editLokasi);
    startTransition(async () => {
      const res = await adminUpdateKhidmat(requestId, fd);
      if (!res.ok) {
        setError(res.error ?? "Permohonan tidak dapat dikemas kini.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" ? (
          <>
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={pending}
              onClick={() => run(() => adminApproveKhidmat(requestId), undefined, "approved")}
            >
              Lulus
            </button>
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={pending}
              onClick={() => run(() => adminRejectKhidmat(requestId), undefined, "rejected")}
            >
              Tolak
            </button>
          </>
        ) : (
          <WhatsAppPemohonLink href={decisionWhatsappUrl} className="btn-primary btn-sm" />
        )}
        {canEditKhidmatFromAdmin(status) && (
          <button
            type="button"
            className="text-sm font-medium text-ink hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() => {
              resetEditForm();
              setError(null);
              setEditing((value) => !value);
            }}
          >
            Ubah
          </button>
        )}
        {canDeleteKhidmatFromAdmin(status) && (
          <button
            type="button"
            className="text-sm font-medium text-bloom-deep hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              run(
                () => adminDeleteKhidmat(requestId),
                "Padam permohonan ini secara kekal? Surat permohonan di Drive juga akan dibuang.",
              )
            }
          >
            Padam
          </button>
        )}
      </div>

      {editing && (
        <form
          onSubmit={saveActivity}
          className="mt-3 space-y-3 rounded-lg border border-fog/80 bg-cloud/30 p-3"
        >
          <div>
            <label className="label" htmlFor={`service-${requestId}`}>
              Jenis perkhidmatan
            </label>
            <select
              id={`service-${requestId}`}
              className="input"
              value={editServiceType}
              onChange={(e) => setEditServiceType(e.target.value)}
            >
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`tajuk-${requestId}`}>
              Tajuk program
            </label>
            <input
              id={`tajuk-${requestId}`}
              className="input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              maxLength={300}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`date-${requestId}`}>
                Tarikh
              </label>
              <input
                id={`date-${requestId}`}
                type="date"
                className="input"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor={`time-${requestId}`}>
                Masa
              </label>
              <input
                id={`time-${requestId}`}
                className="input"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                required
                placeholder="cth. 9:00 pagi – 12:00 tengah hari"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor={`lokasi-${requestId}`}>
              Lokasi / venue
            </label>
            <input
              id={`lokasi-${requestId}`}
              className="input"
              value={editLokasi}
              onChange={(e) => setEditLokasi(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary btn-sm" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              Tutup
            </button>
          </div>
        </form>
      )}
      {error && <p className="mt-1 text-xs text-bloom-deep">{error}</p>}
    </div>
  );
}
