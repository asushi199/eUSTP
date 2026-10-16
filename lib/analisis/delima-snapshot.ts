import "server-only";

import { and, asc, count, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisDelimaSchools, analisisDelimaSnapshots } from "@/lib/schema";
import type {
  DelimaLive,
  DelimaLivePop,
  DelimaSchoolList,
  DelimaSchoolPop,
  DelimaSchoolRow,
  DelimaTahap,
} from "./delima-live";
import { DELIMA_D3_SUMBER } from "./delima-d3-parse";

export const DELIMA_HISTORY_PAGE_SIZE = 10;

const BULAN_MS = ["jan", "feb", "mac", "apr", "mei", "jun", "jul", "ogos", "sep", "okt", "nov", "dis"];
const BULAN_LABEL = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogs", "Sep", "Okt", "Nov", "Dis"];

/** "1 Jan – 31 Ogos 2026" → "2026-08" (hujung tempoh). null jika format tidak dikenali. */
export function periodDariTempoh(tempoh: string): string | null {
  const m = tempoh.match(/[–-]\s*\d{1,2}\s+([A-Za-z]+)\s+(\d{4})\s*$/);
  if (!m) return null;
  const idx = BULAN_MS.findIndex((b) => m[1].toLowerCase().startsWith(b));
  return idx < 0 ? null : `${m[2]}-${String(idx + 1).padStart(2, "0")}`;
}

/** "2026-08" → "Ogos 2026" untuk paparan. */
export function periodLabel(period: string): string {
  const [y, mo] = period.split("-");
  const idx = Number(mo) - 1;
  const nama = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"][idx];
  return nama ? `${nama} ${y}` : period;
}

export type DelimaSnapshotRow = {
  id: number;
  period: string;
  tempoh: string;
  daerah: string;
  sumberUrl: string;
  capturedOn: string;
  guruAktif: number;
  guruJumlah: number;
  guruPct: number;
  muridAktif: number;
  muridJumlah: number;
  muridPct: number;
  kadPct: number | null;
  kadSasaran: number | null;
  bilSekolah: number | null;
  bilCapai: number | null;
  guru30Pct: number | null;
  guru30Aktif: number | null;
  guru30Jumlah: number | null;
  murid30Pct: number | null;
  murid30Aktif: number | null;
  murid30Jumlah: number | null;
};

/** Titik carta trend bulanan (peratus aktif guru/murid sumber JPN). */
export type DelimaTrendPoint = {
  bulan: string;
  guru: number;
  murid: number;
};

export type DelimaSnapshotPage = {
  rows: DelimaSnapshotRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const dbPop30 = (
  aktif: number | null,
  jumlah: number | null,
  pct: number | null,
): DelimaLivePop | null =>
  aktif == null || jumlah == null || pct == null ? null : { aktif, jumlah, peratus: pct };

const dbPop = (
  aktif: number | null,
  jumlah: number | null,
  pct: number | null,
  tahap: string | null,
): DelimaSchoolPop | null =>
  aktif == null || jumlah == null || pct == null
    ? null
    : { aktif, jumlah, peratus: pct, tahap: (tahap as DelimaTahap) ?? "Rendah" };

/**
 * Sekolah murid capai sasaran KPI daripada snapshot terbaharu yang sudah dikira
 * (null jika belum pernah dikira). Snapshot tempoh baharu yang belum siap dikira dilangkau
 * supaya "Capaian Murid" tidak hilang sementara menunggu pengiraan.
 */
export async function getDelimaCapaiTerkini(): Promise<{ capai: number; jumlah: number } | null> {
  const [r] = await db
    .select({ capai: analisisDelimaSnapshots.bilCapai, jumlah: analisisDelimaSnapshots.bilSekolah })
    .from(analisisDelimaSnapshots)
    .where(and(isNotNull(analisisDelimaSnapshots.bilCapai), isNotNull(analisisDelimaSnapshots.bilSekolah)))
    .orderBy(desc(analisisDelimaSnapshots.period))
    .limit(1);
  return r && r.capai != null && r.jumlah != null ? { capai: r.capai, jumlah: r.jumlah } : null;
}

/** Sejarah snapshot, terbaharu dahulu, berhalaman. */
export async function listDelimaSnapshots(
  page: number,
  pageSize: number = DELIMA_HISTORY_PAGE_SIZE,
): Promise<DelimaSnapshotPage> {
  const [{ total }] = await db.select({ total: count() }).from(analisisDelimaSnapshots);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const rows = await db
    .select({
      id: analisisDelimaSnapshots.id,
      period: analisisDelimaSnapshots.period,
      tempoh: analisisDelimaSnapshots.tempoh,
      daerah: analisisDelimaSnapshots.daerah,
      sumberUrl: analisisDelimaSnapshots.sumberUrl,
      capturedOn: analisisDelimaSnapshots.capturedOn,
      guruAktif: analisisDelimaSnapshots.guruAktif,
      guruJumlah: analisisDelimaSnapshots.guruJumlah,
      guruPct: analisisDelimaSnapshots.guruPct,
      muridAktif: analisisDelimaSnapshots.muridAktif,
      muridJumlah: analisisDelimaSnapshots.muridJumlah,
      muridPct: analisisDelimaSnapshots.muridPct,
      kadPct: analisisDelimaSnapshots.kadPct,
      kadSasaran: analisisDelimaSnapshots.kadSasaran,
      bilSekolah: analisisDelimaSnapshots.bilSekolah,
      bilCapai: analisisDelimaSnapshots.bilCapai,
      guru30Pct: analisisDelimaSnapshots.guru30Pct,
      guru30Aktif: analisisDelimaSnapshots.guru30Aktif,
      guru30Jumlah: analisisDelimaSnapshots.guru30Jumlah,
      murid30Pct: analisisDelimaSnapshots.murid30Pct,
      murid30Aktif: analisisDelimaSnapshots.murid30Aktif,
      murid30Jumlah: analisisDelimaSnapshots.murid30Jumlah,
    })
    .from(analisisDelimaSnapshots)
    .orderBy(desc(analisisDelimaSnapshots.period))
    .limit(pageSize)
    .offset((p - 1) * pageSize);
  return { rows, total, page: p, pageSize, pageCount };
}

/** Senarai sekolah satu snapshot (susunan kod sekolah). */
export async function getDelimaSnapshotSchools(
  snapshotId: number,
): Promise<{ tempoh: string; period: string; schools: DelimaSchoolRow[] } | null> {
  const [snap] = await db
    .select({
      tempoh: analisisDelimaSnapshots.tempoh,
      period: analisisDelimaSnapshots.period,
    })
    .from(analisisDelimaSnapshots)
    .where(eq(analisisDelimaSnapshots.id, snapshotId))
    .limit(1);
  if (!snap) return null;
  const rows = await db
    .select()
    .from(analisisDelimaSchools)
    .where(eq(analisisDelimaSchools.snapshotId, snapshotId))
    .orderBy(asc(analisisDelimaSchools.kod));
  return {
    ...snap,
    schools: rows.map((r) => ({
      kod: r.kod,
      nama: r.nama,
      guru: dbPop(r.guruAktif, r.guruJumlah, r.guruPct, r.guruTahap),
      murid: dbPop(r.muridAktif, r.muridJumlah, r.muridPct, r.muridTahap),
      // undefined (bukan null) bila snapshot tiada 3.0 — UI tidak papar baris 3.0 kosong.
      guru30: dbPop30(r.guru30Aktif, r.guru30Jumlah, r.guru30Pct) ?? undefined,
      murid30: dbPop30(r.murid30Aktif, r.murid30Jumlah, r.murid30Pct) ?? undefined,
    })),
  };
}

/** Titik carta trend bulanan daripada snapshot (tertua → terbaharu). */
export async function getDelimaSnapshotTrend(): Promise<DelimaTrendPoint[]> {
  const rows = await db
    .select({
      period: analisisDelimaSnapshots.period,
      guru: analisisDelimaSnapshots.guruPct,
      murid: analisisDelimaSnapshots.muridPct,
    })
    .from(analisisDelimaSnapshots)
    .orderBy(asc(analisisDelimaSnapshots.period));
  const beberapaTahun = new Set(rows.map((r) => r.period.slice(0, 4))).size > 1;
  return rows.map((r) => {
    const [y, mo] = r.period.split("-");
    const bulan = BULAN_LABEL[Number(mo) - 1] ?? r.period;
    return {
      bulan: beberapaTahun ? `${bulan} ${y.slice(2)}` : bulan,
      guru: r.guru,
      murid: r.murid,
    };
  });
}

export async function deleteDelimaSnapshot(id: number): Promise<void> {
  await db.delete(analisisDelimaSnapshots).where(eq(analisisDelimaSnapshots.id, id));
}

/** Snapshot terbaharu (d3) dalam bentuk data semasa: ringkasan daerah + senarai sekolah. */
export type DelimaTerkini = { period: string; live: DelimaLive; schools: DelimaSchoolList };

/**
 * Data DELIMa semasa = snapshot d3.delima.edu.my terbaharu (import manual bulanan).
 * null jika belum ada import d3.
 */
export async function getDelimaTerkini(): Promise<DelimaTerkini | null> {
  const [s] = await db
    .select()
    .from(analisisDelimaSnapshots)
    .where(eq(analisisDelimaSnapshots.sumberUrl, DELIMA_D3_SUMBER))
    .orderBy(desc(analisisDelimaSnapshots.period))
    .limit(1);
  if (!s) return null;
  const sekolah = await getDelimaSnapshotSchools(s.id);
  return {
    period: s.period,
    live: {
      daerah: s.daerah,
      guru: { aktif: s.guruAktif, jumlah: s.guruJumlah, peratus: s.guruPct },
      murid: { aktif: s.muridAktif, jumlah: s.muridJumlah, peratus: s.muridPct },
      bilSekolah: s.bilSekolah,
      tempoh: s.tempoh,
      sumberUrl: s.sumberUrl,
    },
    schools: { schools: sekolah?.schools ?? [], tempoh: s.tempoh, daerah: s.daerah },
  };
}
