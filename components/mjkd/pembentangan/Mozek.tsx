"use client";

import { STATUS_MJKD_LABEL, isStatusMjkd } from "@/lib/mjkd/enums";
import { STATUS_HANTAR, ukuranMozek, type TileSekolah } from "@/lib/mjkd/pembentangan";

export const labelStatusJubin = (s: string | null) =>
  s === null
    ? "Belum menghantar"
    : s === STATUS_HANTAR
      ? "Telah menghantar"
      : isStatusMjkd(s)
        ? STATUS_MJKD_LABEL[s]
        : s;

/**
 * Mozek sekolah: SEMUA sekolah yang perkara itu terpakai, satu grid tanpa zon, diisih SR → SM kemudian kod sekolah;
 * warna = status, kotak putus-putus = belum menghantar, ★ = Sorotan, denyut = BARU. Saiz jubin
 * dikira supaya semuanya muat tanpa tatal.
 */
export default function Mozek({
  jubin,
  lebar,
  tinggi,
  onKlik,
}: {
  jubin: readonly TileSekolah[];
  lebar: number;
  tinggi: number;
  onKlik: (kod: string) => void;
}) {
  const u = ukuranMozek(jubin.length, lebar, tinggi);
  return (
    <div className="pt-mozek" style={{ width: lebar, height: tinggi }}>
      <div
        className="pt-jubin-grid"
        style={{ gridTemplateColumns: `repeat(${u.lajur}, ${u.w}px)`, gap: u.gap }}
      >
        {jubin.map((j, i) => (
          <button
            key={j.kod}
            type="button"
            className={`pt-jubin s-${j.status ?? "KOSONG"}${j.baru ? " baru-on" : ""}`}
            style={{ height: u.h, fontSize: u.fon, animationDelay: `${Math.min(i * 6, 600)}ms` }}
            onClick={() => onKlik(j.kod)}
            aria-label={`${j.nama} — ${labelStatusJubin(j.status)}${j.sorotan ? " (Sorotan)" : ""}`}
            title={j.nama}
          >
            <span>{j.namaPendek}</span>
            {j.sorotan ? (
              <em className="pt-bintang" aria-hidden>
                ★
              </em>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
