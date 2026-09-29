"use server";

import { getAnalisisData } from "@/lib/analisis/queries";
import {
  fetchDelimaSchoolDetail,
  fetchDelimaSchools,
  type DelimaSchoolDetail,
  type DelimaSchoolList,
} from "@/lib/analisis/delima-live";

async function konfigurasi() {
  const { metrics } = await getAnalisisData("delima");
  return {
    url: metrics.get("delima_live_url")?.trim() || undefined,
    daerah: metrics.get("delima_daerah")?.trim() || undefined,
  };
}

export async function loadDelimaSchools(): Promise<DelimaSchoolList | null> {
  const c = await konfigurasi();
  return fetchDelimaSchools(c.url, c.daerah);
}

export async function loadDelimaSchoolDetail(kod: string): Promise<DelimaSchoolDetail | null> {
  const code = kod.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return null;
  const c = await konfigurasi();
  return fetchDelimaSchoolDetail(code, c.url, c.daerah);
}
