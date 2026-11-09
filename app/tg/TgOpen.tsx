"use client";

/* Detik pertama Mini App: Telegram meletakkan siapa yang membukanya dalam alamat
   (#tgWebAppData=…). Data itu dihantar ke pelayan sekali (tgOpen), yang log masukkan dan terus ke
   halaman. Skrip telegram-web-app.js tidak dimuatkan (tiada apa-apa dari laman lain): dua panggilan
   yang dibuatnya — "ready" dan "expand" — dihantar di sini dengan cara yang sama. initData disimpan
   dalam sessionStorage supaya /tg masih mengenalinya selepas log masuk ID + kata laluan. */
import Image from "next/image";
import { useEffect, useState } from "react";
import { APP_LOGO_SRC } from "@/lib/branding";
import { tgOpen, type TgOpenError } from "./actions";

const STORE_KEY = "nexa:tgWebAppData";

const MESSAGES: Record<"wait" | TgOpenError, string> = {
  wait: "Membuka portal…",
  bad: "Telegram anda tidak dapat disahkan. Tutup dan tekan butang dalam mesej sekali lagi.",
  old: "Halaman ini dibuka terlalu lama. Tutup dan tekan butang dalam mesej sekali lagi.",
  notLinked:
    "Telegram ini belum dikenali sebagai akaun portal anda. Log masuk sekali dengan ID dan kata laluan. Jika Telegram ini disambungkan pada akaun anda (nama anda › Telegram › Notifikasi peribadi), butang NexaBot seterusnya akan terus log masuk.",
};

type TelegramProxy = { TelegramWebviewProxy?: { postEvent(type: string, data: string): void } };

/** Seperti telegram-web-app.js menghantar acara: ke paparan web aplikasi, atau ke Telegram Web di sekelilingnya. */
function tell(type: string) {
  try {
    const w = window as unknown as TelegramProxy;
    if (w.TelegramWebviewProxy) w.TelegramWebviewProxy.postEvent(type, "");
    else if (window.parent !== window) {
      window.parent.postMessage(JSON.stringify({ eventType: type, eventData: "" }), "*");
    }
  } catch {}
}

function readInitData(): string | null {
  const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("tgWebAppData");
  try {
    if (fromHash) sessionStorage.setItem(STORE_KEY, fromHash);
    else return sessionStorage.getItem(STORE_KEY);
  } catch {}
  return fromHash;
}

export default function TgOpen({ ke }: { ke: string }) {
  const [error, setError] = useState<TgOpenError | null>(null);

  useEffect(() => {
    tell("web_app_ready");
    tell("web_app_expand");
    const data = readInitData();
    /* bukan dalam Telegram: pautan biasa (middleware meminta log masuk jika perlu) */
    if (!data) {
      window.location.replace(ke);
      return;
    }
    tgOpen(data, ke)
      .then((result) => {
        if (result) setError(result.error);
      })
      .catch(() => setError("bad"));
  }, [ke]);

  const loginHref = `/login?from=${encodeURIComponent(`/tg?ke=${encodeURIComponent(ke)}`)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud p-4">
      <div className="card w-full max-w-md p-8 text-center" aria-live="polite">
        <span className="relative mx-auto mb-5 block h-16 w-16 overflow-hidden rounded-xl border border-primary/20 bg-white">
          <Image src={APP_LOGO_SRC} alt="" fill className="object-contain p-1.5" sizes="64px" priority />
        </span>
        <p className={error ? "text-sm leading-relaxed text-bloom-deep" : "text-sm text-graphite"}>
          {MESSAGES[error ?? "wait"]}
        </p>
        {error === "notLinked" ? (
          <a href={loginHref} className="btn-primary mt-6 inline-flex">
            Log masuk dengan ID
          </a>
        ) : null}
      </div>
    </main>
  );
}
