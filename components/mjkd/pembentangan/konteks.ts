"use client";

import { createContext, useContext } from "react";
import type { StatusMjkd } from "@/lib/mjkd/enums";

/** Konteks bersama slaid (acara, QR kehadiran, navigasi, Spotlight). */
export type KonteksSlaid = {
  acara: { tarikh: string; tempat: string };
  kehadiran: { url: string; qr: string };
  keKunci: (kunci: string) => void;
  /** Slaid sebelum / seterusnya (zon navigasi di atas iframe). */
  gerak: (d: number) => void;
  bukaSpot: (perkaraId: string, kod: string) => void;
  /** Semua jawapan satu sekolah (slaid Semua soalan). */
  bukaSekolah: (kod: string) => void;
  /** Perkara & sekolah bagi satu status (kotak status Papan Pemuka). */
  bukaStatus: (status: StatusMjkd) => void;
  /** URL gambar bukti (lalai: thumbnail Drive). */
  urlFoto: (path: string, sz: number) => string;
};

export const KonteksPentas = createContext<KonteksSlaid | null>(null);

export function usePentas(): KonteksSlaid {
  const k = useContext(KonteksPentas);
  if (!k) throw new Error("usePentas di luar <Pentas>");
  return k;
}
