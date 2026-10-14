"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Teks yang mengecil sendiri (carian perduaan saiz fon) supaya muat dalam kotaknya; di bawah
 * `min` kotak boleh ditatal (`overflow:auto`). Ukuran tidak terjejas oleh `transform: scale`.
 */
export default function TeksMuat({
  maks,
  min,
  as: Tag = "div",
  className,
  style,
  children,
  kunci,
}: {
  maks: number;
  min: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** Ubah untuk mengukur semula (cth. teks). */
  kunci?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const muat = (f: number) => {
      el.style.fontSize = `${f}px`;
      // Toleransi ~0.25em: huruf berekor melimpah kotak baris bila line-height ketat.
      const tol = Math.max(1, f * 0.25);
      return el.scrollHeight <= el.clientHeight + tol && el.scrollWidth <= el.clientWidth + 1;
    };
    if (muat(maks)) return;
    let lo = min;
    let hi = maks;
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      if (muat(mid)) lo = mid;
      else hi = mid;
    }
    el.style.fontSize = `${Math.floor(lo)}px`;
  }, [maks, min, kunci]);

  return (
    <Tag ref={ref} className={className} style={{ fontSize: maks, ...style }}>
      {children}
    </Tag>
  );
}
