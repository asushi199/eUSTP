"use client";

import { useState, useTransition } from "react";
import {
  createTelegramBindingLink,
  disconnectTelegram,
} from "@/lib/actions/telegram";

export default function TelegramBindingCard({
  connected,
  username,
  boundAt,
}: {
  connected: boolean;
  username: string | null;
  boundAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [bindingUrl, setBindingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generateLink() {
    setError(null);
    startTransition(async () => {
      const result = await createTelegramBindingLink();
      if (!result.ok || !result.url) {
        setError(result.error ?? "Pautan Telegram tidak dapat dijana.");
        return;
      }
      setBindingUrl(result.url);
    });
  }

  return (
    <div className="card mt-5 max-w-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Notifikasi peribadi Telegram</h2>
          <p className="mt-1 text-sm leading-relaxed text-graphite">
            Sambungkan akaun sekali sahaja. Pegawai penerima notifikasi ditetapkan
            di bawah mengikut PKG.
          </p>
        </div>
        <span className="status-badge">
          <span className={`status-dot ${connected ? "bg-primary" : "bg-amber-400"}`} />
          {connected ? "Disambungkan" : "Belum disambungkan"}
        </span>
      </div>

      {connected ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-md bg-cloud px-4 py-3 text-sm text-charcoal">
            <p>{username ? `@${username}` : "Akaun Telegram telah disahkan"}</p>
            {boundAt ? <p className="mt-1 text-xs text-graphite">Disambungkan {boundAt}</p> : null}
          </div>
          <form action={disconnectTelegram}>
            <button type="submit" className="btn-outline-ink">
              Putuskan Sambungan
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <button
            type="button"
            className="btn-primary"
            disabled={pending}
            onClick={generateLink}
          >
            {pending ? "Menjana pautan…" : "Sambungkan Telegram"}
          </button>
          {bindingUrl ? (
            <div className="rounded-md border hairline bg-cloud/50 p-4">
              <p className="text-sm text-charcoal">
                Pautan sah selama 10 minit. Buka Telegram dan tekan <b>Start</b>.
              </p>
              <a
                href={bindingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-3 inline-flex"
              >
                Buka Telegram
              </a>
            </div>
          ) : null}
          {error ? <p className="text-sm text-bloom-deep">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
