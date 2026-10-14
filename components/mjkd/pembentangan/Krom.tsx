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

/** Bar atas 76px (sorok selepas 3 s tanpa gerakan tetikus) — bab, status data, kawalan. */
export default function Krom({
  tarikh,
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
  tarikh: string;
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
  return (
    <header className="pt-krom">
      <div className="pt-jenama">
        <span className="pt-plak">
          <img src={LOGO_MJKD} alt="KPM — PPD Manjung" />
        </span>
        <div>
          <b>MJKD 2026</b>
          <small>{tarikh}</small>
        </div>
      </div>
      <nav className="pt-bab" aria-label="Bab">
        {SENARAI_BAB.map((b) => (
          <button key={b.id} type="button" aria-current={bab === b.id} onClick={() => onBab(b.id)}>
            {b.label}
          </button>
        ))}
      </nav>
      <div className="pt-kanan">
        <span
          className={`pt-langsung${status.jenis === "langsung" ? "" : " lapuk"}`}
          title="Data disemak setiap 15–30 saat (R = segar sekarang)"
        >
          <i aria-hidden />
          {teksStatus(status)}
        </span>
        <button type="button" className="pt-hantu" onClick={() => onGerak(-1)} disabled={kedudukan <= 0} aria-label="Slaid sebelum">
          ←
        </button>
        <span className="pt-nombor" aria-live="polite">
          {jumlah ? kedudukan + 1 : 0} / {jumlah}
        </span>
        <button type="button" className="pt-hantu" onClick={() => onGerak(1)} disabled={kedudukan >= jumlah - 1} aria-label="Slaid seterusnya">
          →
        </button>
        <button type="button" className="pt-hantu" onClick={onTema} title="Tema terang / gelap (T)">
          {tema === "terang" ? "Gelap" : "Terang"}
        </button>
        <button type="button" className="pt-hantu" onClick={onNav} title="Semua slaid (G)">
          Semua slaid
        </button>
        <button type="button" className="pt-hantu" onClick={onPenuh} title="Skrin penuh (F)">
          {skrinPenuh ? "Keluar penuh" : "Skrin penuh"}
        </button>
        <button type="button" className="pt-hantu" onClick={onKeluar} disabled={sedangKeluar}>
          {sedangKeluar ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </header>
  );
}
