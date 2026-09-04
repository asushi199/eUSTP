"use client";

import { useState } from "react";
import type { CardEmbedInfo } from "@/lib/kandungan/embed-urls";
import { driveFileDownloadUrl } from "@/lib/kandungan/embed-urls";
import PreviewLightbox, {
  type PreviewLightboxItem,
} from "./PreviewLightbox";

/**
 * Kad kandungan. YouTube: thumbnail dahulu. PDF/imej pada CoE Resources
 * dipaparkan terus dalam kad; Lihat penuh membesarkan iframe.
 */
export default function CardEmbed({
  title,
  blurb,
  url,
  typeLabel,
  embed,
  gallery,
  galleryIndex = 0,
  inlinePreview = false,
}: {
  title: string;
  blurb: string;
  url: string;
  typeLabel: string;
  embed: CardEmbedInfo;
  gallery?: PreviewLightboxItem[];
  galleryIndex?: number;
  inlinePreview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(galleryIndex);
  const canPreview = embed.mode !== "none";
  const lightboxItems = gallery ?? [{ title, url, embed }];
  const downloadHref = driveFileDownloadUrl(url);
  const fileHref = inlinePreview && downloadHref ? downloadHref : url;
  const fileLabel = inlinePreview
    ? downloadHref
      ? "Muat Turun"
      : "Buka"
    : "Buka Penuh";

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

      {open && embed.mode === "youtube" ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-fog">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${embed.videoId}?autoplay=1`}
            title={title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}

      {inlinePreview && canPreview && embed.mode !== "youtube" ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-fog">
          {embed.mode === "image" ? (
            <img
              src={embed.src}
              alt={title}
              loading="lazy"
              className="max-h-80 w-full object-contain"
            />
          ) : embed.mode === "iframe" ? (
            <iframe
              src={embed.src}
              title={title}
              className="h-80 w-full"
              loading="lazy"
              allowFullScreen
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-3 pt-3">
        <a href={fileHref} target="_blank" rel="noopener noreferrer" className="link-blue text-sm">
          {fileLabel}
        </a>
        {canPreview && embed.mode !== "youtube" ? (
          <button
            type="button"
            onClick={() => {
              setPreviewIndex(galleryIndex);
              setPreview(true);
            }}
            className="text-sm font-medium text-graphite underline-offset-2 hover:text-ink hover:underline"
          >
            {inlinePreview ? "Lihat penuh" : "Pratonton"}
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

      {preview ? (
        <PreviewLightbox
          items={lightboxItems}
          index={previewIndex}
          onIndex={setPreviewIndex}
          onClose={() => setPreview(false)}
        />
      ) : null}
    </div>
  );
}
