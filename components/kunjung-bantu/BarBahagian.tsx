"use client";

import type { RefObject } from "react";
import { ACCENT_KUNJUNG_BANTU } from "@/lib/kunjung-bantu/instrumen";

export type TabBahagian = {
  id: string;
  no: string;
  label: string;
  lengkap: boolean;
  /** Ada item "perlu dibaiki" — titik merah. */
  baiki?: boolean;
};

/**
 * Tatal ke atas bahagian (di bawah bar atas h-16) dan tengahkan cip tab dalam bar.
 * Dua scrollIntoView "smooth" berturutan saling membatalkan dalam Chrome — tatal menegak
 * (tetingkap) dan mendatar (bar tab) secara berasingan.
 */
export function tatalKeBahagian(sauh: HTMLElement | null, idCip: string) {
  setTimeout(() => {
    if (sauh) {
      const y = sauh.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
    const cip = document.getElementById(idCip);
    const bar = cip?.parentElement;
    if (cip && bar && bar.scrollWidth > bar.clientWidth) {
      bar.scrollTo({ left: cip.offsetLeft - bar.clientWidth / 2 + cip.clientWidth / 2, behavior: "smooth" });
    }
  }, 30);
}

/** Bar tab bahagian yang melekat di bawah bar atas, dengan kiraan & bar kemajuan. */
export default function BarBahagian({
  tabs,
  aktif,
  onPilih,
  sauhRef,
  awalanId,
  label = "bahagian lengkap",
}: {
  tabs: TabBahagian[];
  aktif: string;
  onPilih: (id: string) => void;
  sauhRef: RefObject<HTMLDivElement | null>;
  /** Awalan id DOM cip, cth. "kb-tab" → "kb-tab-a1". */
  awalanId: string;
  label?: string;
}) {
  const bilLengkap = tabs.filter((t) => t.lengkap).length;
  const semasa = tabs.find((t) => t.id === aktif);
  return (
    <>
      <div ref={sauhRef} aria-hidden />
      <nav
        aria-label="Bahagian instrumen"
        className="sticky top-16 z-30 -mx-4 border-b hairline bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Telefon: tab hanya nombor — nama bahagian semasa dipaparkan di sini. */}
          <p className="min-w-0 truncate text-sm font-semibold text-ink sm:hidden">
            {semasa ? `${semasa.no} · ${semasa.label}` : ""}
          </p>
          <p className="shrink-0 text-xs font-semibold text-graphite">
            {bilLengkap}/{tabs.length}
            <span className="hidden sm:inline"> {label}</span>
          </p>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-fog" aria-hidden>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(bilLengkap / tabs.length) * 100}%`,
                backgroundColor: ACCENT_KUNJUNG_BANTU,
              }}
            />
          </div>
        </div>
        {/* Telefon: semua tab dalam satu baris grid (tiada tatal mendatar); skrin besar: cip berlabel. */}
        <div
          className="mt-2 grid gap-1.5 pt-1 sm:flex sm:flex-wrap sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          role="tablist"
        >
          {tabs.map((t) => {
            const dipilih = t.id === aktif;
            return (
              <button
                key={t.id}
                id={`${awalanId}-${t.id}`}
                type="button"
                role="tab"
                aria-selected={dipilih}
                aria-label={`${t.no} ${t.label}${t.lengkap ? " (lengkap)" : ""}`}
                title={t.label}
                onClick={() => onPilih(t.id)}
                className={`relative inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border text-sm font-semibold transition sm:shrink-0 sm:px-3 ${
                  dipilih
                    ? "border-ink bg-ink text-white"
                    : t.lengkap
                      ? "text-white"
                      : "border-steel bg-white text-charcoal hover:border-ink"
                }`}
                style={
                  !dipilih && t.lengkap
                    ? { backgroundColor: ACCENT_KUNJUNG_BANTU, borderColor: ACCENT_KUNJUNG_BANTU }
                    : undefined
                }
              >
                <span className="tabular-nums sm:opacity-80">{t.no}</span>
                <span className="hidden sm:inline">{t.label}</span>
                {t.lengkap ? (
                  <span className="hidden sm:inline" aria-hidden>
                    ✓
                  </span>
                ) : null}
                {t.baiki ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-bloom-deep"
                    aria-label="ada item perlu dibaiki"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/** Butang Sebelumnya / Seterusnya di bawah kandungan bahagian. */
export function NavBahagian({
  sebelum,
  seterus,
  onPilih,
  akhir,
}: {
  sebelum: { id: string; label: string } | null;
  seterus: { id: string; label: string } | null;
  onPilih: (id: string) => void;
  akhir: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {sebelum ? (
        <button type="button" className="btn-outline-ink" onClick={() => onPilih(sebelum.id)}>
          ← {sebelum.label}
        </button>
      ) : (
        <span />
      )}
      {seterus ? (
        <button type="button" className="btn-ink" onClick={() => onPilih(seterus.id)}>
          {seterus.label} →
        </button>
      ) : (
        <p className="text-right text-sm text-graphite">{akhir}</p>
      )}
    </div>
  );
}
