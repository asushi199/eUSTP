"use client";

import { useRef } from "react";
import type { SlaidMinit as T } from "@/lib/mjkd/pembentangan";
import LapisanPenuh from "../LapisanPenuh";

/** Pengesahan minit: metadata + senarai para (kiri); PDF dalam lapisan tidak diskala (kanan). */
export default function SlaidMinit({ slaid }: { slaid: T }) {
  const kotak = useRef<HTMLDivElement>(null);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "600px minmax(0,1fr)", gap: 56, height: "100%" }}>
      <div
        className="pt-anim"
        style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}
      >
        <p className="pt-label">Pengesahan minit</p>
        <h2 className="pt-tajuk">Minit Mesyuarat {slaid.label}</h2>
        <p className="pt-redup" style={{ fontSize: 28, margin: 0 }}>
          {slaid.tarikh}
          {slaid.tempat ? ` · ${slaid.tempat}` : ""}
        </p>
        <div className="pt-kaca" style={{ padding: "24px 28px", marginTop: 16 }}>
          <p className="pt-label" style={{ fontSize: 16 }}>
            {slaid.para.length} perkara tindakan PGB
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {slaid.para.map((p, i) => (
              <span key={`${p}-${i}`} className="pt-cip" style={{ fontWeight: 700, color: "var(--teks)" }}>
                {p}
              </span>
            ))}
          </div>
        </div>
        {slaid.minitUrl ? (
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <a className="pt-butang-emas" href={slaid.muatTurunUrl}>
              Muat turun minit
            </a>
            <a
              className="pt-hantu"
              href={slaid.minitUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 18 }}
            >
              Buka di tab baharu ↗
            </a>
          </div>
        ) : null}
      </div>
      {slaid.minitUrl ? (
        <div ref={kotak} style={{ borderRadius: 18, background: "#fff" }}>
          <LapisanPenuh sasaran={kotak}>
            <iframe title={`Minit ${slaid.label}`} src={slaid.minitUrl} />
          </LapisanPenuh>
        </div>
      ) : (
        <div className="pt-kaca pt-kosong pt-anim">
          <p style={{ fontSize: 40, margin: 0 }}>Minit belum dimuat naik.</p>
        </div>
      )}
    </div>
  );
}
