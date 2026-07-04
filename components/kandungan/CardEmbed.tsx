"use client";

import { useState } from "react";
import type { CardEmbedInfo } from "@/lib/kandungan/embed-urls";

/**
 * Kad kandungan dengan pratonton klik-untuk-muat — iframe TIDAK dimuat
 * sehingga pengguna tekan "Pratonton" (elak berpuluh iframe serentak).
 * YouTube: papar thumbnail dahulu; iframe hanya selepas klik main.
 */
export default function CardEmbed({
  title,
  blurb,
  url,
  typeLabel,
  embed,
}: {
  title: string;
  blurb: string;
  url: string;
  typeLabel: string;
  embed: CardEmbedInfo;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const canPreview = embed.mode !== "none";

  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">{title}</p>
        <span className="status-badge shrink-0">{typeLabel}</span>
      </div>
      {blurb ? <p className="mt-1 text-sm leading-relaxed text-graphite">{blurb}</p> : null}

      {embed.mode === "youtube" && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative mt-3 block overflow-hidden rounded-lg border border-fog"
          aria-label={`Main video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${embed.videoId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/80 text-white transition group-hover:bg-ink">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      ) : null}

      {open && canPreview ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-fog">
          {failed ? (
            <p className="p-4 text-sm text-graphite">
              Pratonton tidak tersedia — fail mungkin belum dikongsi secara
              terbuka. Sila guna pautan &ldquo;Buka Penuh&rdquo;.
            </p>
          ) : embed.mode === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={embed.src}
              alt={title}
              loading="lazy"
              className="max-h-96 w-full object-contain"
              onError={() => setFailed(true)}
            />
          ) : embed.mode === "youtube" ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${embed.videoId}?autoplay=1`}
              title={title}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <iframe
              src={embed.src}
              title={title}
              className="h-80 w-full"
              loading="lazy"
              allowFullScreen
            />
          )}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-3 pt-3">
        <a href={url} target="_blank" rel="noopener noreferrer" className="link-blue text-sm">
          Buka Penuh
        </a>
        {canPreview && embed.mode !== "youtube" ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-sm font-medium text-graphite underline-offset-2 hover:text-ink hover:underline"
          >
            {open ? "Tutup Pratonton" : "Pratonton"}
          </button>
        ) : null}
        {embed.mode === "youtube" && open ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-graphite underline-offset-2 hover:text-ink hover:underline"
          >
            Tutup Video
          </button>
        ) : null}
      </div>
    </div>
  );
}
