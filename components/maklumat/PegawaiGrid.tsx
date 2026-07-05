"use client";

import { useEffect, useRef, useState } from "react";
import { driveImageUrl } from "@/lib/kandungan/embed-urls";

export type PegawaiItem = {
  id: number;
  nama: string;
  jawatan: string;
  telefon: string;
  photoUrl: string;
  detailUrl: string;
};

/** Saiz lebih besar untuk imej lh3 (Drive) dalam lightbox. */
function largeImageUrl(url: string): string {
  const src = driveImageUrl(url);
  return /^https:\/\/lh3\.googleusercontent\.com\/d\//.test(src) ? `${src}=w1600` : src;
}

/**
 * Grid pegawai USTP — foto boleh diklik untuk paparan besar (lightbox)
 * kerana imej profil mengandungi maklumat padat.
 */
export default function PegawaiGrid({ senarai }: { senarai: PegawaiItem[] }) {
  const [active, setActive] = useState<PegawaiItem | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {senarai.map((p) => (
          <div key={p.id} className="card flex items-start gap-4 p-4">
            {p.photoUrl ? (
              <button
                type="button"
                onClick={() => setActive(p)}
                aria-label={`Besarkan foto ${p.nama}`}
                className="group relative h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-fog focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={driveImageUrl(p.photoUrl)}
                  alt={p.nama}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <span
                  className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded bg-ink/60 text-white"
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="h-3 w-3"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3M8 11h6M11 8v6" />
                  </svg>
                </span>
              </button>
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-cloud text-graphite">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  className="h-7 w-7"
                >
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
                </svg>
              </span>
            )}
            <div className="min-w-0">
              <p className="font-semibold leading-snug">{p.nama}</p>
              {p.jawatan ? (
                <p className="mt-0.5 text-xs leading-relaxed text-graphite">{p.jawatan}</p>
              ) : null}
              {p.telefon ? <p className="mt-1 text-sm text-graphite">{p.telefon}</p> : null}
            </div>
          </div>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/80 p-4"
          onClick={() => setActive(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Foto ${active.nama}`}
            className="flex max-h-full w-full max-w-3xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{active.nama}</p>
                {active.jawatan ? (
                  <p className="truncate text-xs text-white/70">{active.jawatan}</p>
                ) : null}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setActive(null)}
                aria-label="Tutup"
                className="shrink-0 rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={largeImageUrl(active.detailUrl || active.photoUrl)}
                alt={`Foto penuh ${active.nama}`}
                className="mx-auto max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
