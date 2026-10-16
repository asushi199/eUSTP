"use server";

import { getDelimaBelumLogin } from "@/lib/analisis/delima-belum-store";
import {
  DELIMA_HISTORY_PAGE_SIZE,
  getDelimaSnapshotSchools,
  getDelimaTerkini,
  listDelimaSnapshots,
  type DelimaSnapshotPage,
} from "@/lib/analisis/delima-snapshot";
import { getDelimaArkib } from "@/lib/analisis/delima-arkib";
import type { DelimaArkib } from "@/lib/analisis/delima-arkib-meta";
import type {
  DelimaSchoolDetail,
  DelimaSchoolList,
  DelimaSchoolRow,
} from "@/lib/analisis/delima-live";

/** Arkib penggunaan DELIMa tahun lepas (peratus aktif sekolah sahaja). */
export async function loadDelimaArkib(tahun: number): Promise<DelimaArkib | null> {
  if (!Number.isInteger(tahun)) return null;
  return getDelimaArkib(tahun);
}

export async function loadDelimaSchools(): Promise<DelimaSchoolList | null> {
  return (await getDelimaTerkini())?.schools ?? null;
}

export async function loadDelimaSchoolDetail(kod: string): Promise<DelimaSchoolDetail | null> {
  const code = kod.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return null;
  const terkini = await getDelimaTerkini();
  const school = terkini?.schools.schools.find((s) => s.kod === code);
  if (!terkini || !school) return null;
  return {
    school,
    tempoh: terkini.live.tempoh,
    sumberUrl: terkini.live.sumberUrl,
    belumLogin: await getDelimaBelumLogin(code),
  };
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
