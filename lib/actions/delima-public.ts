"use server";

import { getDelimaConfig } from "@/lib/analisis/queries";
import {
  DELIMA_HISTORY_PAGE_SIZE,
  getDelimaSnapshotSchools,
  listDelimaSnapshots,
  type DelimaSnapshotPage,
} from "@/lib/analisis/delima-snapshot";
import type { DelimaSchoolRow } from "@/lib/analisis/delima-live";
import {
  fetchDelimaSchoolDetail,
  fetchDelimaSchools,
  type DelimaSchoolDetail,
  type DelimaSchoolList,
} from "@/lib/analisis/delima-live";

export async function loadDelimaSchools(): Promise<DelimaSchoolList | null> {
  const c = await getDelimaConfig();
  return fetchDelimaSchools(c.url, c.daerah);
}

export async function loadDelimaSchoolDetail(kod: string): Promise<DelimaSchoolDetail | null> {
  const code = kod.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return null;
  const c = await getDelimaConfig();
  return fetchDelimaSchoolDetail(code, c.url, c.daerah);
}

/** Sejarah snapshot bulanan, berhalaman. */
export async function loadDelimaHistory(page: number): Promise<DelimaSnapshotPage> {
  return listDelimaSnapshots(page, DELIMA_HISTORY_PAGE_SIZE);
}

/** Senarai sekolah dalam satu snapshot lama. */
export async function loadDelimaSnapshotSchools(
  id: number,
): Promise<{ tempoh: string; period: string; schools: DelimaSchoolRow[] } | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  return getDelimaSnapshotSchools(id);
}
