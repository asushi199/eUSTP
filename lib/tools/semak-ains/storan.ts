import type { TetapanGpm } from "./standard";

const AWALAN = "semak-ains:tetapan:";

/** Tetapan GPM disimpan dalam localStorage pelayar sahaja (spesifikasi §7.2). */
export function bacaTetapan(kunci: string): TetapanGpm | null {
  try {
    const t = window.localStorage.getItem(AWALAN + kunci);
    return t ? (JSON.parse(t) as TetapanGpm) : null;
  } catch {
    return null;
  }
}

export function simpanTetapan(kunci: string, t: TetapanGpm): void {
  try {
    if (Object.keys(t).length === 0) window.localStorage.removeItem(AWALAN + kunci);
    else window.localStorage.setItem(AWALAN + kunci, JSON.stringify(t));
  } catch {
    /* storan disekat atau penuh — tetapan kekal untuk sesi ini sahaja */
  }
}

export function padamTetapan(kunci: string): void {
  try {
    window.localStorage.removeItem(AWALAN + kunci);
  } catch {
    /* abaikan */
  }
}

const KUNCI_SESI = "semak-ains:sesi";
const HAD_SESI_MS = 6 * 60 * 60 * 1000;
type TapisanSesi = { tahun?: string; kelas?: string };

/**
 * Tapisan bacaan terakhir tab ini (sessionStorage) supaya rekod dibaca semula secara automatik
 * selepas tab dimuat semula. Hanya tahun/kelas + nama sekolah — tiada data murid.
 */
export function simpanSesi(namaSekolah: string, tapisan: TapisanSesi): void {
  try {
    window.sessionStorage.setItem(KUNCI_SESI, JSON.stringify({ namaSekolah, tapisan, masa: Date.now() }));
  } catch {
    /* storan disekat — tiada sambung semula automatik */
  }
}

export function bacaSesi(namaSekolah: string): TapisanSesi | null {
  try {
    const t = window.sessionStorage.getItem(KUNCI_SESI);
    if (!t) return null;
    const s = JSON.parse(t) as { namaSekolah?: unknown; tapisan?: { tahun?: unknown; kelas?: unknown }; masa?: unknown };
    if (s.namaSekolah !== namaSekolah || typeof s.masa !== "number" || Date.now() - s.masa > HAD_SESI_MS) return null;
    return {
      tahun: typeof s.tapisan?.tahun === "string" ? s.tapisan.tahun : undefined,
      kelas: typeof s.tapisan?.kelas === "string" ? s.tapisan.kelas : undefined,
    };
  } catch {
    return null;
  }
}
