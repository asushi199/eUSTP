"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import WhatsAppPemohonLink from "@/components/admin/WhatsAppPemohonLink";
import {
  getNotifyPemohonCopy,
  type NotifyPemohonDecision,
} from "@/lib/admin/notify-pemohon";

export default function NotifyPemohonDialog({
  open,
  href,
  decision,
  onClose,
}: {
  open: boolean;
  href: string;
  decision: NotifyPemohonDecision;
  onClose: () => void;
}) {
  const copy = getNotifyPemohonCopy(decision);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Tutup"
        className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notify-pemohon-title"
        className="fixed left-1/2 top-1/2 z-[60] w-[min(100%-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border hairline bg-white p-5 shadow-modal"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="notify-pemohon-title" className="text-base font-semibold">
            {copy.title}
          </h3>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border hairline text-lg text-graphite hover:text-ink"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-graphite">
          {href ? copy.body : copy.missingPhone}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {href ? (
            <WhatsAppPemohonLink
              href={href}
              className="btn-primary btn-sm"
              onClick={onClose}
            />
          ) : null}
          <button
            type="button"
            className={href ? "btn-outline-ink btn-sm" : "btn-primary btn-sm"}
            onClick={onClose}
          >
            {copy.dismissLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
