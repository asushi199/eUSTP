"use server";

import { getDirectoryContactAccess } from "@/lib/direktori/access";
import { getAinsMuridSekolah, getAinsTahun } from "@/lib/analisis/ains-queries";
import type { AinsMuridRow, AinsTahunData } from "@/lib/analisis/ains-types";

/** Ringkasan sekolah/bulan terbuka kepada orang awam (tiada data peribadi). */
export async function loadAinsTahun(tahun: number): Promise<AinsTahunData | null> {
  if (!Number.isInteger(tahun)) return null;
  return getAinsTahun(tahun);
}

export type AinsMuridResult =
  | { ok: true; rows: AinsMuridRow[] }
  | { ok: false; reason: "login" | "tidak-sah" };

/**
 * Senarai murid (nama + bacaan) hanya untuk akaun MOE-DL (@moe-dl.edu.my) atau staf USTP,
 * sama seperti Semak Tebus Buku. E-mel murid tidak pernah dipulangkan.
 */
export async function loadAinsMurid(tahun: number, kod: string): Promise<AinsMuridResult> {
  const code = kod.trim().toUpperCase();
  if (!Number.isInteger(tahun) || !/^[A-Z0-9]{4,12}$/.test(code)) {
    return { ok: false, reason: "tidak-sah" };
  }
  const access = await getDirectoryContactAccess();
  if (!access.ok) return { ok: false, reason: "login" };
  return { ok: true, rows: await getAinsMuridSekolah(tahun, code) };
}
