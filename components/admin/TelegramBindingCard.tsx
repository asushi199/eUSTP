"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TelegramBindingActionResult } from "@/lib/actions/telegram";

export default function TelegramBindingCard({
  title,
  description,
  connected,
  username,
  boundAt,
  generateAction,
  disconnectAction,
  connectClassName = "btn-ink",
}: {
  title: string;
  description: string;
  connected: boolean;
  username: string | null;
  boundAt: string | null;
  generateAction: () => Promise<TelegramBindingActionResult>;
  disconnectAction: () => Promise<void>;
  connectClassName?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [bindingUrl, setBindingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generateLink() {
    setError(null);
    startTransition(async () => {
      const result = await generateAction();
      if (!result.ok || !result.url) {
        setError(result.error ?? "Pautan Telegram tidak dapat dijana.");
        return;
      }
      setBindingUrl(result.url);
    });
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-graphite">{description}</p>
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
            {boundAt ? (
              <p className="mt-1 text-xs text-graphite">Disambungkan {boundAt}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-outline-ink"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await disconnectAction();
                router.refresh();
              })
            }
          >
            Putuskan Sambungan
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <button
            type="button"
            className={connectClassName}
            disabled={pending}
            onClick={generateLink}
          >
            {pending ? "Menjana pautan…" : "Jana pautan Telegram"}
          </button>
          {bindingUrl ? (
            <div className="rounded-md border hairline bg-cloud/50 p-4">
              <p className="text-sm text-charcoal">
                Pautan sah selama 10 minit. Hantar kepada pegawai PKG ini, kemudian
                buka Telegram dan tekan <b>Start</b>.
              </p>
              <a
                href={bindingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ink mt-3 inline-flex"
              >
                Buka Telegram
              </a>
              <p className="mt-2 break-all text-xs text-graphite">{bindingUrl}</p>
            </div>
          ) : null}
          {error ? <p className="text-sm text-bloom-deep">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
