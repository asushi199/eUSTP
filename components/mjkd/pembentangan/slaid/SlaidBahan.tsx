"use client";

import { useEffect, useRef, useState } from "react";
import type { SlaidBahan as T } from "@/lib/mjkd/pembentangan";
import LapisanPenuh from "../LapisanPenuh";
import QrPautan from "../QrPautan";
import { usePentas } from "../konteks";

/**
 * Bahan sektor: dibenam skrin penuh (lapisan tidak diskala, di bawah krom) + jalur nama pembentang
 * yang pudar selepas 3 s. Tidak boleh dibenam = kad besar "Buka di tab baharu" + QR.
 */
export default function SlaidBahan({ slaid }: { slaid: T }) {
  const { gerak } = usePentas();
  const kotak = useRef<HTMLDivElement>(null);
  const [kapsyen, setKapsyen] = useState(true);
  // Jalur nama pudar selepas 3 s; muncul semula bila tetikus bergerak (di luar iframe).
  useEffect(() => {
    let t = 0;
    const tunjuk = () => {
      setKapsyen(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setKapsyen(false), 3000);
    };
    tunjuk();
    window.addEventListener("mousemove", tunjuk);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousemove", tunjuk);
    };
  }, [slaid.kunci]);

  if (!slaid.embedUrl) {
    return (
      <div className="pt-kosong">
        <p className="pt-label pt-anim">
          {slaid.sektorUnit} · {slaid.hariLabel}
        </p>
        <h2 className="pt-tajuk pt-anim" style={{ maxWidth: 1500 }}>
          {slaid.tajuk}
        </h2>
        <p className="pt-redup pt-anim" style={{ fontSize: 28, margin: 0 }}>
          {slaid.namaPembentang}
        </p>
        <div className="pt-kaca pt-anim" style={{ display: "flex", gap: 40, alignItems: "center", padding: "32px 40px", marginTop: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start", maxWidth: 720 }}>
            <p style={{ fontSize: 26, margin: 0, textAlign: "left" }}>
              Bahan ini tidak boleh dipaparkan di sini.
            </p>
            <p className="pt-redup" style={{ fontFamily: "var(--mono)", fontSize: 18, margin: 0, overflowWrap: "anywhere", textAlign: "left" }}>
              {slaid.bukaUrl}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a className="pt-butang-emas" href={slaid.bukaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 22 }}>
                Buka di tab baharu ↗
              </a>
              {slaid.muatTurunUrl ? (
                <a className="pt-hantu" href={slaid.muatTurunUrl} style={{ fontSize: 18 }}>
                  Muat turun
                </a>
              ) : null}
            </div>
          </div>
          <QrPautan teks={slaid.bukaUrl} saiz={260} label="Kod QR bahan" />
        </div>
      </div>
    );
  }

  return (
    <div ref={kotak} style={{ position: "absolute", left: 0, right: 0, top: 76, bottom: 5, background: "#f7f5f0" }}>
      <LapisanPenuh sasaran={kotak}>
        <iframe title={slaid.tajuk} src={slaid.embedUrl} allow="fullscreen" allowFullScreen />
        {/* iframe merampas fokus papan kekunci: zon tepi ini mengembalikan kawalan (klik = slaid
            sebelum/seterusnya; selepas itu ← → / Esc berfungsi semula). */}
        <button type="button" className="pt-zon-nav kiri" onClick={() => gerak(-1)} aria-label="Slaid sebelum">
          ‹
        </button>
        <button type="button" className="pt-zon-nav kanan" onClick={() => gerak(1)} aria-label="Slaid seterusnya">
          ›
        </button>
        <div className={`pt-bawah-tiga${kapsyen ? "" : " hilang"}`}>
          <div>
            <b style={{ fontSize: 22, display: "block" }}>{slaid.namaPembentang || slaid.tajuk}</b>
            <span style={{ fontSize: 16, opacity: 0.75 }}>
              {slaid.sektorUnit} · {slaid.hariLabel}
            </span>
          </div>
        </div>
      </LapisanPenuh>
    </div>
  );
}
