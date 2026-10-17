"use client";

import { League_Spartan } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import type { SlaidUtama as T } from "@/lib/mjkd/pembentangan";
import { urlVideoUtama } from "../pramuat-utama";

/** Fon teks agenda dalam Canva. */
const fonCanva = League_Spartan({ subsets: ["latin"], display: "swap" });

/** 1 pt PowerPoint = 4/3 px pada kanvas 1920 lebar. */
const PX = 4 / 3;

/** Kelas elemen video — Pentas menyemak keadaannya untuk kekunci ← → / Space. */
export const KELAS_VIDEO_UTAMA = "pt-utama-video";

/**
 * Halaman slaid utama rasmi (Canva): imej penuh 1920×1080 (reka bentuk asal — pengecualian
 * tema pentas), teks agenda di atas latar, atau video lagu yang dimainkan dengan bunyi.
 */
export default function SlaidUtama({ slaid }: { slaid: T }) {
  return (
    <div className={`pt-utama ${fonCanva.className}`}>
      <img src={slaid.gambar} alt={slaid.tajuk} draggable={false} />
      {slaid.teks.map((t, i) => (
        <div
          key={i}
          className="pt-utama-teks"
          style={{
            left: t.x,
            top: t.y,
            width: t.w,
            fontSize: t.pt * PX,
            lineHeight: `${t.lnPt * PX}px`,
            textDecoration: t.garis ? "underline" : undefined,
          }}
        >
          {t.baris.map((b, j) => (
            <div key={j}>{b}</div>
          ))}
        </div>
      ))}
      {slaid.video ? <VideoLagu src={slaid.video} poster={slaid.gambar} /> : null}
    </div>
  );
}

/**
 * Video dimainkan automatik bila slaid dibuka (kekunci/klik = gerak isyarat pengguna, jadi bunyi
 * dibenarkan). Jika pelayar menyekat (cth. muat semula terus ke slaid ini) — butang Main.
 */
function VideoLagu({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [disekat, setDisekat] = useState(false);
  const [url] = useState(() => urlVideoUtama(src));

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => setDisekat(true));
  }, []);

  const main = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused || v.ended) {
      void v.play().then(() => setDisekat(false)).catch(() => setDisekat(true));
    } else v.pause();
  };

  return (
    <>
      <video
        ref={ref}
        className={KELAS_VIDEO_UTAMA}
        src={url}
        poster={poster}
        preload="auto"
        playsInline
        onClick={main}
        onPlay={() => setDisekat(false)}
      />
      {disekat ? (
        <button type="button" className="pt-utama-main" onClick={main}>
          ▶ Main video
        </button>
      ) : null}
    </>
  );
}
