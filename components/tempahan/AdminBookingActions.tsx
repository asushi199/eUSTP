"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminApproveBooking,
  adminCancelBooking,
  adminDeleteBooking,
  adminRejectBooking,
  adminRetryAutosijilSync,
  adminUpdateBookingSchedule,
} from "@/lib/actions/tempahan-admin";
import {
  canDeleteBookingFromAdmin,
  canEditBookingFromAdmin,
} from "@/lib/tempahan/admin-booking";
import {
  formatSlot,
  slots,
  type BookingStatus,
  type Slot,
} from "@/lib/tempahan/booking-rules";
import { useNotifyPemohon } from "@/components/admin/NotifyPemohonProvider";
import type { NotifyPemohonPrompt } from "@/lib/admin/notify-pemohon";
import { buildBookingDecisionWhatsAppUrl } from "@/lib/tempahan/whatsapp";
import { formatMalayDate } from "@/lib/tempahan/date";

export default function AdminBookingActions({
  pkgId,
  bookingId,
  status,
  currentDate,
  currentSlot,
  applicantName,
  applicantPhone,
  roomName,
  purpose,
  autosijilSyncStatus = null,
  autosijilSyncError = null,
  cetakToken = null,
  autosijilAdminUrl = null,
  requiresCertificate = false,
  isMultiDay = false,
}: {
  pkgId: string;
  bookingId: string;
  status: BookingStatus;
  currentDate: string;
  currentSlot: Slot;
  applicantName: string;
  applicantPhone: string;
  roomName: string;
  purpose: string;
  autosijilSyncStatus?: string | null;
  autosijilSyncError?: string | null;
  cetakToken?: string | null;
  autosijilAdminUrl?: string | null;
  requiresCertificate?: boolean;
  isMultiDay?: boolean;
}) {
  const router = useRouter();
  const { promptNotifyPemohon } = useNotifyPemohon();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(currentDate);
  const [slot, setSlot] = useState<Slot>(currentSlot);
  const [needSijil, setNeedSijil] = useState(requiresCertificate);
  const decisionWhatsappUrl =
    status === "approved" || status === "rejected"
      ? buildBookingDecisionWhatsAppUrl(applicantPhone, {
          name: applicantName,
          room: roomName,
          purpose,
          date: formatMalayDate(currentDate),
          slot: formatSlot(currentSlot),
          decision: status,
        })
      : "";

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    confirmMsg?: string,
    notifyDecision?: NotifyPemohonPrompt["decision"],
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
          href: buildBookingDecisionWhatsAppUrl(applicantPhone, {
            name: applicantName,
            room: roomName,
            purpose,
            date: formatMalayDate(currentDate),
            slot: formatSlot(currentSlot),
            decision: notifyDecision,
          }),
          decision: notifyDecision,
        };
        window.setTimeout(() => promptNotifyPemohon(prompt), 0);
      }
      router.refresh();
    });
  }

  function saveSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("date", date);
    fd.set("slot", slot);
    startTransition(async () => {
      const res = await adminUpdateBookingSchedule(pkgId, bookingId, fd);
      if (!res.ok) {
        setError(res.error ?? "Tarikh tempahan tidak dapat dikemas kini.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div>
      {status === "pending" && (
        <label className="mb-2 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={needSijil}
            onChange={(e) => setNeedSijil(e.target.checked)}
            disabled={pending}
          />
          Perlu sijil untuk peserta
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" && (
          <>
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={pending}
              onClick={() =>
                run(() => adminApproveBooking(pkgId, bookingId, needSijil), undefined, "approved")
              }
            >
              {isMultiDay ? "Lulus semua hari" : "Lulus"}
            </button>
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={pending}
              onClick={() =>
                run(() => adminRejectBooking(pkgId, bookingId), undefined, "rejected")
              }
            >
              {isMultiDay ? "Tolak semua hari" : "Tolak"}
            </button>
          </>
        )}
        {canEditBookingFromAdmin(status) && (
          <button
            type="button"
            className="text-sm font-medium text-ink hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() => {
              setDate(currentDate);
              setSlot(currentSlot);
              setError(null);
              setEditing((value) => !value);
            }}
          >
            Ubah
          </button>
        )}
        {(status === "pending" || status === "approved") && (
          <button
            type="button"
            className="text-sm font-medium text-bloom-deep hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              run(
                () => adminCancelBooking(pkgId, bookingId),
                "Batalkan tempahan ini?",
              )
            }
          >
            Batal
          </button>
        )}
        {canDeleteBookingFromAdmin(status) && (
          <button
            type="button"
            className="text-sm font-medium text-bloom-deep hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              run(
                () => adminDeleteBooking(pkgId, bookingId),
                "Padam tempahan ini secara kekal? Rekod kehadiran yang berkaitan juga akan dipadam.",
              )
            }
          >
            Padam
          </button>
        )}
      </div>

      {status === "approved" && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {decisionWhatsappUrl && (
            <a
              href={decisionWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-ink btn-sm"
            >
              WhatsApp pemohon
            </a>
          )}
          {cetakToken && (
            <a
              href={`/tempahan/${pkgId}/cetak-kehadiran/${cetakToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-ink btn-sm"
            >
              Cetak QR kehadiran
            </a>
          )}
          {autosijilAdminUrl && (
            <a
              href={autosijilAdminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-ink btn-sm"
            >
              Urus kehadiran / sijil
            </a>
          )}
          {(autosijilSyncStatus === "failed" ||
            (!autosijilAdminUrl && autosijilSyncStatus !== "synced")) && (
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              disabled={pending}
              onClick={() => run(() => adminRetryAutosijilSync(pkgId, bookingId))}
            >
              Cuba sync Autosijil semula
            </button>
          )}
        </div>
      )}

      {status === "rejected" && decisionWhatsappUrl && (
        <div className="mt-2">
          <a
            href={decisionWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-ink btn-sm"
          >
            WhatsApp pemohon
          </a>
        </div>
      )}

      {status === "approved" && autosijilSyncStatus === "failed" && autosijilSyncError && (
        <p className="mt-1 text-xs text-bloom-deep">Sync Autosijil gagal: {autosijilSyncError}</p>
      )}

      {editing && (
        <form onSubmit={saveSchedule} className="mt-3 space-y-3 rounded-lg border border-fog/80 bg-cloud/30 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`date-${bookingId}`}>
                Tarikh
              </label>
              <input
                id={`date-${bookingId}`}
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor={`slot-${bookingId}`}>
                Slot
              </label>
              <select
                id={`slot-${bookingId}`}
                className="input"
                value={slot}
                onChange={(e) => setSlot(e.target.value as Slot)}
              >
                {slots.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-graphite">
            Tarikh semasa: {currentDate} · {formatSlot(currentSlot)}
          </p>
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
