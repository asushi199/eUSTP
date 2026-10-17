"use client";

import { SEMUA_GAMBAR_UTAMA, VIDEO_SLAID_UTAMA } from "@/lib/mjkd/slaid-utama";

/**
 * Pramuat slaid utama Canva sebaik mod pembentangan dibuka: imej ke cache pelayar, video lagu
 * dimuat turun SEPENUHNYA ke Blob (main tanpa bergantung pada Wi-Fi tempat acara).
 */
let blobVideo: string | null = null;
let sudah = false;

export function pramuatUtama(): void {
  if (sudah) return;
  sudah = true;
  for (const src of SEMUA_GAMBAR_UTAMA) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
  void fetch(VIDEO_SLAID_UTAMA)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then((b) => {
      blobVideo = URL.createObjectURL(b);
    })
    .catch(() => {
      sudah = false; // cuba lagi bila Pentas dimuat semula; video masih boleh distrim
    });
}

/** URL video: Blob setempat jika sudah dimuat, jika tidak URL rangkaian. */
export function urlVideoUtama(src: string): string {
  return src === VIDEO_SLAID_UTAMA && blobVideo ? blobVideo : src;
}
