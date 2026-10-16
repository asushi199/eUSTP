"use server";

import { getDelimaConfig } from "@/lib/analisis/queries";
import { getDelimaBelumLogin } from "@/lib/analisis/delima-belum-store";
import {
  DELIMA_HISTORY_PAGE_SIZE,
  getDelimaSnapshotSchools,
  listDelimaSnapshots,
  pilihDelimaD3,
  type DelimaSnapshotPage,
} from "@/lib/analisis/delima-snapshot";
import { getDelimaArkib } from "@/lib/analisis/delima-arkib";
import type { DelimaArkib } from "@/lib/analisis/delima-arkib-meta";
import type { DelimaSchoolRow } from "@/lib/analisis/delima-live";
import {
  fetchDelimaLive,
  fetchDelimaSchoolDetail,
  fetchDelimaSchools,
  type DelimaSchoolDetail,
  type DelimaSchoolList,
} from "@/lib/analisis/delima-live";

/** Arkib penggunaan DELIMa tahun lepas (peratus aktif sekolah sahaja). */
export async function loadDelimaArkib(tahun: number): Promise<DelimaArkib | null> {
  if (!Number.isInteger(tahun)) return null;
  return getDelimaArkib(tahun);
}

/** Snapshot d3 jika ia sumber paparan semasa (lihat `pilihDelimaD3`). */
async function d3Semasa() {
  const c = await getDelimaConfig();
  return { c, d3: await pilihDelimaD3(await fetchDelimaLive(c.url, c.daerah)) };
}

export async function loadDelimaSchools(): Promise<DelimaSchoolList | null> {
  const { c, d3 } = await d3Semasa();
  return d3 ? d3.schools : fetchDelimaSchools(c.url, c.daerah);
}

export async function loadDelimaSchoolDetail(kod: string): Promise<DelimaSchoolDetail | null> {
  const code = kod.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return null;
  const { c, d3 } = await d3Semasa();
  const d3Row = d3?.schools.schools.find((s) => s.kod === code);
  const detail: DelimaSchoolDetail | null = d3Row
    ? { school: d3Row, kadMurid: null, tempoh: d3!.live.tempoh, sumberUrl: d3!.live.sumberUrl }
    : await fetchDelimaSchoolDetail(code, c.url, c.daerah);
  if (!detail) return null;
  return { ...detail, belumLogin: await getDelimaBelumLogin(code) };
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
