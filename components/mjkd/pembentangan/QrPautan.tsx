"use client";

import { useEffect, useState } from "react";

/** Kod QR dijana di pelayar (pakej `qrcode` dimuat malas) — untuk pautan bukti / bahan. */
export default function QrPautan({ teks, saiz = 150, label }: { teks: string; saiz?: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let batal = false;
    void import("qrcode")
      .then((QR) =>
        QR.toDataURL(teks, { width: saiz * 2, margin: 1, errorCorrectionLevel: "M" }),
      )
      .then((url) => {
        if (!batal) setSrc(url);
      })
      .catch(() => undefined);
    return () => {
      batal = true;
    };
  }, [teks, saiz]);
  if (!src) return <span style={{ width: saiz, height: saiz, display: "block", background: "#fff", borderRadius: 8 }} aria-hidden />;
  return <img src={src} alt={label} width={saiz} height={saiz} style={{ background: "#fff", borderRadius: 8, imageRendering: "pixelated" }} />;
}
