"use server";

import { getSessionUser } from "@/lib/rbac";
import { getAinsMuridSekolah, getAinsTahun } from "@/lib/analisis/ains-queries";
import type { AinsMuridRow, AinsTahunData } from "@/lib/analisis/ains-types";

/** Data Ains hanya untuk staf (senarai murid mengandungi nama) — akaun MOE-DL/awam ditolak. */
async function adaStaf(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && user.authKind !== "moe-dl";
}

export async function loadAinsTahun(tahun: number): Promise<AinsTahunData | null> {
  if (!Number.isInteger(tahun) || !(await adaStaf())) return null;
  return getAinsTahun(tahun);
}

export async function loadAinsMurid(tahun: number, kod: string): Promise<AinsMuridRow[] | null> {
  const code = kod.trim().toUpperCase();
  if (!Number.isInteger(tahun) || !/^[A-Z0-9]{4,12}$/.test(code)) return null;
  if (!(await adaStaf())) return null;
  return getAinsMuridSekolah(tahun, code);
}
