"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import NotifyPemohonDialog from "@/components/admin/NotifyPemohonDialog";
import WhatsAppPemohonLink from "@/components/admin/WhatsAppPemohonLink";
import {
  adminApproveKhidmat,
  adminRejectKhidmat,
} from "@/lib/actions/khidmat-bantu-admin";
import type { NotifyPemohonPrompt } from "@/lib/admin/notify-pemohon";
import { buildKhidmatDecisionWhatsAppUrl } from "@/lib/khidmat-bantu/whatsapp";

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
}: {
  requestId: string;
  status: string;
  applicantPhone?: string;
  whatsappDetails?: KhidmatWhatsAppDetails;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notify, setNotify] = useState<NotifyPemohonPrompt | null>(null);
  const [resolvedDecision, setResolvedDecision] = useState<
    NotifyPemohonPrompt["decision"] | null
  >(null);
  const displayStatus = resolvedDecision ?? status;

  function decisionUrl(decision: NotifyPemohonPrompt["decision"]) {
    if (!whatsappDetails) return "";
    return buildKhidmatDecisionWhatsAppUrl(applicantPhone, {
      ...whatsappDetails,
      decision,
    });
  }

  const decisionWhatsappUrl =
    displayStatus === "approved" || displayStatus === "rejected"
      ? decisionUrl(displayStatus)
      : "";

  function closeNotify() {
    setNotify(null);
    router.refresh();
  }

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    notifyDecision: NotifyPemohonPrompt["decision"],
  ) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "Tindakan gagal.");
        return;
      }
      setResolvedDecision(notifyDecision);
      setNotify({
        href: decisionUrl(notifyDecision),
        decision: notifyDecision,
      });
    });
  }

  if (displayStatus !== "pending" && !decisionWhatsappUrl && !notify) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {displayStatus === "pending" ? (
          <>
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={pending}
              onClick={() => run(() => adminApproveKhidmat(requestId), "approved")}
            >
              Lulus
            </button>
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={pending}
              onClick={() => run(() => adminRejectKhidmat(requestId), "rejected")}
            >
              Tolak
            </button>
          </>
        ) : (
          <WhatsAppPemohonLink href={decisionWhatsappUrl} className="btn-primary btn-sm" />
        )}
      </div>
      {error && <p className="mt-1 text-xs text-bloom-deep">{error}</p>}
      <NotifyPemohonDialog
        open={Boolean(notify)}
        href={notify?.href ?? ""}
        decision={notify?.decision ?? "approved"}
        onClose={closeNotify}
      />
    </div>
  );
}
