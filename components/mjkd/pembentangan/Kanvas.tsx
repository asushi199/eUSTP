"use client";

import { useEffect, useState, type ReactNode } from "react";

export const LEBAR_KANVAS = 1920;
export const TINGGI_KANVAS = 1080;

/**
 * Kanvas tetap 1920×1080 yang diskala seragam (`transform: scale`) dan dipusatkan — jalur hitam
 * di tepi bila nisbah skrin berbeza (cth. projektor 4:3). Semua slaid direka dalam px.
 */
export default function Kanvas({ children }: { children: ReactNode }) {
  const [skala, setSkala] = useState(1);

  useEffect(() => {
    const kira = () =>
      setSkala(Math.min(window.innerWidth / LEBAR_KANVAS, window.innerHeight / TINGGI_KANVAS));
    kira();
    window.addEventListener("resize", kira);
    return () => window.removeEventListener("resize", kira);
  }, []);

  return (
    <div
      className="pt-kanvas"
      style={{ transform: `translate(-50%, -50%) scale(${skala})` }}
      role="application"
      aria-label="Mod pembentangan MJKD 2026"
    >
      {children}
    </div>
  );
}
