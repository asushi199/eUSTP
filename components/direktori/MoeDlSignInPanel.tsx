"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";

type InAppKind = "telegram" | "whatsapp" | "other" | null;

function detectInAppBrowser(): InAppKind {
  const ua = navigator.userAgent || "";
  if (/Telegram/i.test(ua)) return "telegram";
  if (/WhatsApp/i.test(ua)) return "whatsapp";
  if (/FBAN|FBAV|Instagram|Line\//i.test(ua)) return "other";
  return null;
}

function openInExternalBrowser() {
  const { host, pathname, search, hash, href } = window.location;
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) {
    window.location.href = `intent://${host}${pathname}${search}${hash}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
    return;
  }
  void navigator.clipboard?.writeText(href);
}

export default function MoeDlSignInPanel({
  callbackUrl,
  googleEnabled,
  errorMessage,
}: {
  callbackUrl: string;
  googleEnabled: boolean;
  errorMessage?: string | null;
}) {
  const [inApp, setInApp] = useState<InAppKind>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInApp(detectInAppBrowser());
  }, []);

  const inAppLabel = useMemo(() => {
    if (inApp === "telegram") return "Telegram";
    if (inApp === "whatsapp") return "WhatsApp";
    if (inApp === "other") return "aplikasi ini";
    return "";
  }, [inApp]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    await signIn("google", { callbackUrl });
  }

  if (inApp) {
    return (
      <div className="card space-y-4 p-6">
        <p className="font-semibold">Buka dalam pelayar telefon</p>
        <p className="text-sm leading-relaxed text-graphite">
          Log masuk MOE-DL tidak boleh dibuat dalam {inAppLabel}. Sila buka halaman
          ini dalam Chrome atau Safari, kemudian log masuk dengan akaun{" "}
          <span className="font-medium text-ink">@moe-dl.edu.my</span>.
        </p>
        {inApp === "telegram" ? (
          <p className="text-sm leading-relaxed text-graphite">
            Dalam Telegram, ketik ikon pelayar / Safari di penjuru, atau salin
            pautan dan tampal dalam Chrome.
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-primary" onClick={openInExternalBrowser}>
            Buka dalam pelayar
          </button>
          <button type="button" className="btn-outline" onClick={() => void onCopy()}>
            {copied ? "Pautan disalin" : "Salin pautan"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-6">
      <p className="text-sm leading-relaxed text-graphite">
        Nombor telefon dan WhatsApp hanya dipaparkan selepas log masuk dengan
        akaun Google KPM <span className="font-medium text-ink">@moe-dl.edu.my</span>.
        Jangan guna Gmail peribadi.
      </p>
      {errorMessage ? <p className="text-sm text-bloom-deep">{errorMessage}</p> : null}
      {googleEnabled ? (
        <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void onGoogle()}>
          {busy ? "Membuka Google…" : "Log masuk dengan MOE-DL"}
        </button>
      ) : (
        <p className="text-sm text-bloom-deep">
          Log masuk Google belum dikonfigurasi. Sila hubungi pentadbir USTP.
        </p>
      )}
    </div>
  );
}
