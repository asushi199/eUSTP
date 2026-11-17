"use client";

import { usePentas } from "../konteks";

/**
 * Portal NEXa: QR besar (gaya slaid Kehadiran) supaya PGB di seluruh dewan boleh mengimbas dan
 * terus membuka laman web (CoE Analytics, Reports, Resources…).
 */
export default function SlaidPortal() {
  const { portal } = usePentas();
  const urlPendek = portal.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
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
          <img src={portal.qr} alt="Kod QR portal NEXa" />
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
          <p className="pt-label">Portal NEXa · USTP Manjung</p>
          <h2 className="pt-tajuk" style={{ fontSize: 72 }}>
            Imbas untuk melayari <span className="pt-emas-grad">NEXa</span>
          </h2>
        </div>
        <div className="pt-kaca" style={{ padding: "30px 36px" }}>
          <p style={{ fontSize: 30, lineHeight: 1.4, margin: 0 }}>
            Data terkini sekolah anda dalam <b>CoE Analytics</b>: DELIMa, DCS, ESN, AI Tools dan lain-lain.
          </p>
          <p className="pt-redup" style={{ fontSize: 24, lineHeight: 1.4, margin: "14px 0 0" }}>
            Boleh dibuka di telefon tanpa log masuk.
          </p>
        </div>
      </div>
    </div>
  );
}
