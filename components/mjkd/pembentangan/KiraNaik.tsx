"use client";

import { useEffect, useRef, useState } from "react";

function kurangGerakan(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Nombor yang "naik" (ease-out ~0.9 s) dari nilai sebelumnya — terus jika gerakan dikurangkan. */
export default function KiraNaik({
  nilai,
  akhiran = "",
  tempoh = 900,
}: {
  nilai: number;
  akhiran?: string;
  tempoh?: number;
}) {
  const [papar, setPapar] = useState(0);
  const dariRef = useRef(0);

  useEffect(() => {
    const dari = dariRef.current;
    if (dari === nilai || kurangGerakan()) {
      dariRef.current = nilai;
      setPapar(nilai);
      return;
    }
    let bingkai = 0;
    const mula = performance.now();
    const langkah = (t: number) => {
      const k = Math.min(1, (t - mula) / tempoh);
      const e = 1 - Math.pow(1 - k, 3);
      setPapar(Math.round(dari + (nilai - dari) * e));
      if (k < 1) bingkai = requestAnimationFrame(langkah);
      else dariRef.current = nilai;
    };
    bingkai = requestAnimationFrame(langkah);
    // Jaminan nilai akhir walaupun rAF dihentikan (tab latar / pelayar menjimat kuasa).
    const jamin = window.setTimeout(() => {
      cancelAnimationFrame(bingkai);
      dariRef.current = nilai;
      setPapar(nilai);
    }, tempoh + 150);
    return () => {
      cancelAnimationFrame(bingkai);
      window.clearTimeout(jamin);
      dariRef.current = nilai;
    };
  }, [nilai, tempoh]);

  return (
    <span className="pt-nombor">
      {papar}
      {akhiran}
    </span>
  );
}
