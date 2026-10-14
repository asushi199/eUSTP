"use client";

import type { SlaidKehadiran as T } from "@/lib/mjkd/pembentangan";
import KiraNaik from "../KiraNaik";
import { usePentas } from "../konteks";

/**
 * Mod imbas: QR besar (~75% tinggi) supaya seluruh dewan boleh mengimbas serentak + dua nombor
 * besar (tanpa penyebut). Tiada titik sekolah / ticker — "siapa belum hadir" dilihat di admin.
 */
export default function SlaidKehadiran({ slaid }: { slaid: T }) {
  const { kehadiran } = usePentas();
  const urlPendek = kehadiran.url.replace(/^https?:\/\//, "");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0,1fr)",
        gap: 90,
        alignItems: "center",
        height: "100%",
      }}
    >
      <div
        className="pt-anim"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}
      >
        <div className="pt-qr-bingkai" style={{ width: 780 }}>
          <img src={kehadiran.qr} alt="Kod QR kehadiran" />
        </div>
        <p
          className="pt-redup"
          style={{ fontFamily: "var(--mono)", fontSize: 26, margin: 0, whiteSpace: "nowrap" }}
        >
          {urlPendek}
        </p>
      </div>
      <div
        className="pt-anim"
        style={{ animationDelay: ".1s", display: "flex", flexDirection: "column", gap: 34, minWidth: 0 }}
      >
        <div>
          <p className="pt-label">Kehadiran · {slaid.hariLabel}</p>
          <h2 className="pt-tajuk" style={{ fontSize: 72 }}>
            Imbas untuk sahkan kehadiran
          </h2>
        </div>
        <div className="pt-kaca" style={{ padding: "30px 36px" }}>
          <p className="pt-label" style={{ fontSize: 18 }}>
            Sekolah hadir
          </p>
          <b style={{ fontSize: 150, lineHeight: 1.05, color: "var(--emas)", display: "block" }}>
            <KiraNaik nilai={slaid.sekolahHadir} />
          </b>
        </div>
        <div className="pt-kaca" style={{ padding: "30px 36px" }}>
          <p className="pt-label" style={{ fontSize: 18 }}>
            Pegawai PPD hadir
          </p>
          <b style={{ fontSize: 110, lineHeight: 1.05, display: "block" }}>
            <KiraNaik nilai={slaid.pegawaiHadir} />
          </b>
          {slaid.pegawaiSektor.length > 0 ? (
            <div
              className="pt-redup"
              style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", marginTop: 8, fontSize: 20 }}
            >
              {slaid.pegawaiSektor.map((s) => (
                <span key={s.sektor}>
                  {s.sektor}{" "}
                  <b className="pt-nombor" style={{ color: "var(--teks)" }}>
                    {s.bil}
                  </b>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
