"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotifyPemohon } from "@/components/admin/NotifyPemohonProvider";
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
  const { promptNotifyPemohon } = useNotifyPemohon();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decisionUrl(decision: NotifyPemohonPrompt["decision"]) {
    if (!whatsappDetails) return "";
    return buildKhidmatDecisionWhatsAppUrl(applicantPhone, {
      ...whatsappDetails,
      decision,
    });
  }

  const decisionWhatsappUrl =
    status === "approved" || status === "rejected" ? decisionUrl(status) : "";

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
      const prompt = {
        href: decisionUrl(notifyDecision),
        decision: notifyDecision,
      };
      window.setTimeout(() => promptNotifyPemohon(prompt), 0);
      router.refresh();
    });
  }

  if (status !== "pending" && !decisionWhatsappUrl) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" ? (
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
    </div>
  );
}
