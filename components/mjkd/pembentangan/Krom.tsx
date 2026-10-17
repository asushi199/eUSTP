"use client";

import { SENARAI_BAB, type Bab } from "@/lib/mjkd/pembentangan";
import type { StatusData } from "./useDataLangsung";

export const LOGO_MJKD = "/mjkd/logo-kpm-ppd-manjung.png";

function jam(d: Date | null): string {
  if (!d) return "--:--";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Teks status data: "Langsung · 10:42" / "Data terakhir 10:40" / "Data luar talian 10:40". */
export function teksStatus(s: StatusData): string {
  if (s.jenis === "luar-talian") return `Data luar talian ${jam(s.masa)}`;
  if (s.jenis === "lapuk") return `Data terakhir ${jam(s.masa)}`;
  return `Langsung · ${jam(s.masa)}`;
}

/** Ikon garis 20px (warna ikut teks). */
function Ikon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const IKON_BULAN = "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z";
const IKON_MATAHARI =
  "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4";
const IKON_GRID = "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z";
const IKON_PENUH = "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3";
const IKON_KECIL = "M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 0-2-2H3M16 21v-3a2 2 0 0 1 2-2h3";

/**
 * Bar atas 76px (hanya muncul bila tetikus di jalur atas — bukan bila kekunci ditekan): jenama | tab bab (tengah) | status data,
 * navigasi slaid, ikon tema / semua slaid / skrin penuh, Keluar. Tarikh acara ada pada slaid.
 */
export default function Krom({
  bab,
  onBab,
  status,
  kedudukan,
  jumlah,
  onGerak,
  tema,
  onTema,
  onNav,
  skrinPenuh,
  onPenuh,
  onKeluar,
  sedangKeluar,
}: {
  bab: Bab;
  onBab: (b: Bab) => void;
  status: StatusData;
  kedudukan: number;
  jumlah: number;
  onGerak: (d: number) => void;
  tema: "terang" | "gelap";
  onTema: () => void;
  onNav: () => void;
  skrinPenuh: boolean;
  onPenuh: () => void;
  onKeluar: () => void;
  sedangKeluar: boolean;
}) {
  const langsung = status.jenis === "langsung";
  return (
    <header className="pt-krom">
      <div className="pt-jenama">
        <span className="pt-plak">
          <img src={LOGO_MJKD} alt="KPM — PPD Manjung" />
        </span>
        <b>MJKD 2026</b>
      </div>
      <nav className="pt-bab" aria-label="Bab">
        {SENARAI_BAB.map((b) => (
          <button key={b.id} type="button" aria-current={bab === b.id} onClick={() => onBab(b.id)} title={b.label}>
            {b.pendek ?? b.label}
          </button>
        ))}
      </nav>
      <div className="pt-kanan">
        <span
          className={`pt-langsung${langsung ? "" : " lapuk"}`}
          title={`${teksStatus(status)} — data disemak setiap 15–30 saat (R = segar sekarang)`}
        >
          <i aria-hidden />
          {langsung ? jam(status.masa) : teksStatus(status)}
        </span>
        <div className="pt-gerak">
          <button type="button" onClick={() => onGerak(-1)} disabled={kedudukan <= 0} aria-label="Slaid sebelum">
            ←
          </button>
          <span className="pt-nombor" aria-live="polite">
            {jumlah ? kedudukan + 1 : 0}
            <small> / {jumlah}</small>
          </span>
          <button type="button" onClick={() => onGerak(1)} disabled={kedudukan >= jumlah - 1} aria-label="Slaid seterusnya">
            →
          </button>
        </div>
        <button
          type="button"
          className="pt-ikon"
          onClick={onTema}
          title={tema === "terang" ? "Tema gelap (T)" : "Tema terang (T)"}
          aria-label={tema === "terang" ? "Tema gelap" : "Tema terang"}
        >
          <Ikon d={tema === "terang" ? IKON_BULAN : IKON_MATAHARI} />
        </button>
        <button type="button" className="pt-ikon" onClick={onNav} title="Semua slaid (G)" aria-label="Semua slaid">
          <Ikon d={IKON_GRID} />
        </button>
        <button
          type="button"
          className="pt-ikon"
          onClick={onPenuh}
          title={skrinPenuh ? "Keluar skrin penuh (F)" : "Skrin penuh (F)"}
          aria-label={skrinPenuh ? "Keluar skrin penuh" : "Skrin penuh"}
        >
          <Ikon d={skrinPenuh ? IKON_KECIL : IKON_PENUH} />
        </button>
        <button type="button" className="pt-hantu" onClick={onKeluar} disabled={sedangKeluar}>
          {sedangKeluar ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </header>
  );
}
