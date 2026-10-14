"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * Akar lapisan tidak diskala (di luar kanvas). `sorokSemua` = navigator / skrin hitam terbuka;
 * `sorokSlaid` = Spotlight terbuka (iframe slaid di bawahnya disorok, pratonton Spotlight kekal).
 */
export const KonteksLapisan = createContext<{
  akar: HTMLElement | null;
  sorokSemua: boolean;
  sorokSlaid: boolean;
}>({ akar: null, sorokSemua: false, sorokSlaid: false });

/**
 * Lapisan penuh TIDAK diskala untuk iframe (PDF minit, Canva, Slides): diletakkan `position:
 * fixed` tepat di atas kotak pemegang tempat di dalam kanvas (getBoundingClientRect), supaya teks
 * kekal tajam. Disorok (bukan dinyahlekap — iframe tidak dimuat semula) bila navigator / skrin
 * hitam / Spotlight dibuka.
 */
export default function LapisanPenuh({
  sasaran,
  children,
  lapisan = "slaid",
}: {
  sasaran: RefObject<HTMLElement | null>;
  children: ReactNode;
  /** "spot" = pratonton dalam Spotlight (tidak disorok oleh Spotlight sendiri). */
  lapisan?: "slaid" | "spot";
}) {
  const { akar, sorokSemua, sorokSlaid } = useContext(KonteksLapisan);
  const sorok = sorokSemua || (lapisan === "slaid" && sorokSlaid);
  const [kotak, setKotak] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // useEffect (bukan useLayoutEffect): ref kotak induk belum dilekat semasa kesan layout anak.
  useEffect(() => {
    const el = sasaran.current;
    if (!el) return;
    const ukur = () => {
      const r = el.getBoundingClientRect();
      setKotak((k) =>
        k && k.left === r.left && k.top === r.top && k.width === r.width && k.height === r.height
          ? k
          : { left: r.left, top: r.top, width: r.width, height: r.height },
      );
    };
    ukur();
    // Animasi masuk slaid menggerakkan kotak ~0.6 s — ukur setiap bingkai seketika.
    let henti = false;
    const mula = performance.now();
    const gelung = () => {
      if (henti) return;
      ukur();
      if (performance.now() - mula < 900) requestAnimationFrame(gelung);
    };
    requestAnimationFrame(gelung);
    window.addEventListener("resize", ukur);
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => {
      henti = true;
      window.removeEventListener("resize", ukur);
      ro.disconnect();
    };
  }, [sasaran]);

  // Fullscreen menukar saiz tetingkap tanpa 'resize' pada sesetengah pelayar.
  useEffect(() => {
    const el = sasaran.current;
    const f = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      setKotak({ left: r.left, top: r.top, width: r.width, height: r.height });
    };
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, [sasaran]);

  if (!akar || !kotak) return null;
  return createPortal(
    <div
      className="pt-penuh"
      style={{ ...kotak, visibility: sorok ? "hidden" : "visible", zIndex: lapisan === "spot" ? 31 : 30 }}
    >
      {children}
    </div>,
    akar,
  );
}
