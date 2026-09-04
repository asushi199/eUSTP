"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CardEmbedInfo } from "@/lib/kandungan/embed-urls";
import { driveFileDownloadUrl } from "@/lib/kandungan/embed-urls";

export type PreviewLightboxItem = {
  title: string;
  url: string;
  embed: CardEmbedInfo;
};

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
      {dir === "prev" ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  );
}

export default function PreviewLightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: PreviewLightboxItem[];
  index: number;
  onClose: () => void;
  onIndex?: (index: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;

  const item = items[index];
  const canPrev = index > 0;
  const canNext = index < items.length - 1;
  const many = items.length > 1;

  const go = useCallback(
    (dir: "prev" | "next") => {
      const i = indexRef.current;
      const next = dir === "prev" ? i - 1 : i + 1;
      if (next < 0 || next >= items.length) return;
      onIndex?.(next);
    },
    [items.length, onIndex],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    closeRef.current?.focus();
  }, [mounted]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go("prev");
      if (e.key === "ArrowRight") go("next");
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose, go]);

  if (!mounted || !item) return null;

  const downloadHref = driveFileDownloadUrl(item.url);
  const fileHref = downloadHref ?? item.url;
  const fileLabel = downloadHref ? "Muat Turun" : "Buka";

  const iframeSrc =
    item.embed.mode === "iframe"
      ? item.embed.src
      : item.embed.mode === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${item.embed.videoId}`
        : null;
  const imageSrc = item.embed.mode === "image" ? item.embed.src : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex h-dvh flex-col overflow-hidden bg-ink"
      role="dialog"
      aria-modal="true"
      aria-label={`Lihat penuh ${item.title}`}
    >
      <div className="flex shrink-0 items-center gap-2 px-3 py-2 text-white">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <p className="truncate text-xs text-white/70">
            {many ? `${index + 1} / ${items.length}` : "Lihat penuh"}
          </p>
        </div>
        <a
          href={fileHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden shrink-0 text-sm font-medium text-white underline-offset-2 hover:underline sm:inline"
        >
          {fileLabel}
        </a>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/10 hover:bg-white/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {iframeSrc ? (
        <div className="relative min-h-0 flex-1 px-3">
          <div className="relative h-full overflow-hidden rounded-xl bg-white shadow-lift">
            <iframe
              key={item.url}
              src={iframeSrc}
              title={item.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {many ? (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/75 text-white disabled:opacity-25"
                  aria-label="Surat sebelumnya"
                  disabled={!canPrev}
                  onClick={() => go("prev")}
                >
                  <Chevron dir="prev" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/75 text-white disabled:opacity-25"
                  aria-label="Surat seterusnya"
                  disabled={!canNext}
                  onClick={() => go("next")}
                >
                  <Chevron dir="next" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : imageSrc ? (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-3">
          <img
            src={imageSrc}
            alt={item.title}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <p className="text-sm text-white/80">
            Paparan tidak tersedia. Muat turun fail untuk lihat dokumen.
          </p>
          <a
            href={fileHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline underline-offset-2"
          >
            {fileLabel}
          </a>
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-2 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-white">
        {many ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-self-start gap-1 rounded-md bg-white/10 px-3 text-sm font-medium disabled:opacity-30"
              disabled={!canPrev}
              onClick={() => go("prev")}
            >
              <Chevron dir="prev" />
              Sebelumnya
            </button>
            <span className="text-center text-xs tabular-nums text-white/70">
              {index + 1} / {items.length}
            </span>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-self-end gap-1 rounded-md bg-white/10 px-3 text-sm font-medium disabled:opacity-30"
              disabled={!canNext}
              onClick={() => go("next")}
            >
              Seterusnya
              <Chevron dir="next" />
            </button>
          </div>
        ) : null}
        <a
          href={fileHref}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 text-center text-sm font-medium leading-[44px] underline-offset-2 hover:underline sm:hidden"
        >
          {fileLabel}
        </a>
      </div>
    </div>,
    document.body,
  );
}
