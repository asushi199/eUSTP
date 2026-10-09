import "server-only";

import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";
import { analisisDelimaSchools, analisisDelimaSnapshots, analisisMetrics } from "@/lib/schema";
import {
  bilSekolahCapai,
  fetchDelimaLive,
  fetchDelimaSchools,
  type DelimaLive,
  type DelimaLivePop,
  type DelimaSchoolList,
  type DelimaSchoolPop,
  type DelimaSchoolRow,
  type DelimaTahap,
} from "./delima-live";

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

/** Titik carta trend bulanan; `guru30`/`murid30` null bagi bulan sebelum DELIMa 3.0 direkod. */
export type DelimaTrendPoint = {
  bulan: string;
  guru: number;
  murid: number;
  murid23: number | null;
  /** Guru gabungan 2.0 + 3.0; null bagi bulan sebelum direkod. */
  guruGab: number | null;
  guru30: number | null;
  murid30: number | null;
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
 * Simpan (upsert) snapshot bagi tempoh data sumber. Idempoten: memanggil semula
 * dalam tempoh sama hanya mengemas kini nombor + senarai sekolah.
 */
export async function saveDelimaSnapshot(
  live: DelimaLive,
  senarai: DelimaSchoolList | null,
  bilCapai: number | null = null,
): Promise<{ id: number; period: string; created: boolean } | null> {
  const today = formatInTimeZone(new Date(), "Asia/Kuala_Lumpur", "yyyy-MM-dd");
  const period = periodDariTempoh(live.tempoh) ?? today.slice(0, 7);
  const values = {
    period,
    tempoh: live.tempoh,
    daerah: live.daerah,
    sumberUrl: live.sumberUrl,
    capturedOn: today,
    guruAktif: live.guru.aktif,
    guruJumlah: live.guru.jumlah,
    guruPct: live.guru.peratus,
    muridAktif: live.murid.aktif,
    muridJumlah: live.murid.jumlah,
    muridPct: live.murid.peratus,
    kadAktif: live.kadMurid?.aktif ?? null,
    kadJumlah: live.kadMurid?.jumlah ?? null,
    kadPct: live.kadMurid?.peratus ?? null,
    kadSasaran: live.kadMurid?.sasaran ?? null,
    bilSekolah: live.bilSekolah,
    // Bilangan capai hanya ditulis bila berjaya dikira — kegagalan sementara (null) tak padam nilai sedia ada.
    ...(bilCapai != null ? { bilCapai } : {}),
    // DELIMa 3.0 hanya ditulis bila CSV berjaya dibaca — kegagalan sementara tak padam rekod sedia ada.
    ...(live.guruGabung
      ? {
          guruGabAktif: live.guruGabung.aktif,
          guruGabJumlah: live.guruGabung.jumlah,
          guruGabPct: live.guruGabung.peratus,
        }
      : {}),
    ...(live.v30
      ? {
          guru30Aktif: live.v30.guru.aktif,
          guru30Jumlah: live.v30.guru.jumlah,
          guru30Pct: live.v30.guru.peratus,
          murid30Aktif: live.v30.murid.aktif,
          murid30Jumlah: live.v30.murid.jumlah,
          murid30Pct: live.v30.murid.peratus,
        }
      : {}),
  };

  return db.transaction(async (tx) => {
    const ada = await tx
      .select({ id: analisisDelimaSnapshots.id, guru30Pct: analisisDelimaSnapshots.guru30Pct })
      .from(analisisDelimaSnapshots)
      .where(eq(analisisDelimaSnapshots.period, period))
      .limit(1);

    let id: number;
    if (ada[0]) {
      id = ada[0].id;
      await tx
        .update(analisisDelimaSnapshots)
        .set({ ...values, updatedAt: sql`now()` })
        .where(eq(analisisDelimaSnapshots.id, id));
    } else {
      const [ins] = await tx
        .insert(analisisDelimaSnapshots)
        .values(values)
        .returning({ id: analisisDelimaSnapshots.id });
      id = ins.id;
    }

    // Senarai sekolah hanya diganti jika berjaya diambil (elak kosongkan sejarah bila sumber gagal separa).
    // Jika CSV 3.0 gagal kali ini tetapi snapshot sudah ada 3.0, kekalkan baris sekolah sedia ada.
    const kekalkanSekolah = !live.v30 && ada[0]?.guru30Pct != null;
    if (senarai && senarai.schools.length > 0 && !kekalkanSekolah) {
      await tx.delete(analisisDelimaSchools).where(eq(analisisDelimaSchools.snapshotId, id));
      await tx.insert(analisisDelimaSchools).values(
        senarai.schools.map((s) => ({
          snapshotId: id,
          kod: s.kod,
          nama: s.nama,
          guruAktif: s.guru?.aktif ?? null,
          guruJumlah: s.guru?.jumlah ?? null,
          guruPct: s.guru?.peratus ?? null,
          guruTahap: s.guru?.tahap ?? null,
          muridAktif: s.murid?.aktif ?? null,
          muridJumlah: s.murid?.jumlah ?? null,
          muridPct: s.murid?.peratus ?? null,
          muridTahap: s.murid?.tahap ?? null,
          guru30Aktif: s.guru30?.aktif ?? null,
          guru30Jumlah: s.guru30?.jumlah ?? null,
          guru30Pct: s.guru30?.peratus ?? null,
          murid30Aktif: s.murid30?.aktif ?? null,
          murid30Jumlah: s.murid30?.jumlah ?? null,
          murid30Pct: s.murid30?.peratus ?? null,
        })),
      );
    }
    return { id, period, created: !ada[0] };
  });
}

/** Ambil data sumber sekarang lalu simpan snapshot (untuk cron / butang admin). */
export async function captureDelimaSnapshot(
  sumberUrl?: string,
  daerah?: string,
): Promise<{ ok: true; period: string; created: boolean } | { ok: false; error: string }> {
  const [live, senarai] = await Promise.all([
    fetchDelimaLive(sumberUrl, daerah),
    fetchDelimaSchools(sumberUrl, daerah),
  ]);
  if (!live) return { ok: false, error: "Sumber DELIMa tidak dapat dicapai." };
  const bilCapai = bilSekolahCapai(senarai, "murid", await getKpiMurid());
  const saved = await saveDelimaSnapshot(live, senarai, bilCapai);
  if (!saved) return { ok: false, error: "Snapshot gagal disimpan." };
  return { ok: true, period: saved.period, created: saved.created };
}

/** Cipta snapshot hanya jika tempoh ini belum ada (dipanggil selepas render halaman awam). */
export async function ensureDelimaSnapshot(
  live: DelimaLive,
  senarai: DelimaSchoolList | null,
  sumberUrl?: string,
  daerah?: string,
): Promise<void> {
  const period = periodDariTempoh(live.tempoh);
  if (period) {
    const ada = await db
      .select({
        id: analisisDelimaSnapshots.id,
        bilCapai: analisisDelimaSnapshots.bilCapai,
        guru30Pct: analisisDelimaSnapshots.guru30Pct,
        guruGabPct: analisisDelimaSnapshots.guruGabPct,
      })
      .from(analisisDelimaSnapshots)
      .where(eq(analisisDelimaSnapshots.period, period))
      .limit(1);
    // Sudah ada, bilangan sekolah capai sudah dikira dan (jika CSV 3.0 ada) 3.0 sudah direkod: tiada apa perlu dibuat.
    if (
      ada[0] &&
      ada[0].bilCapai != null &&
      (!live.v30 || ada[0].guru30Pct != null) &&
      (!live.guruGabung || ada[0].guruGabPct != null)
    )
      return;
  }
  const bilCapai = bilSekolahCapai(senarai, "murid", await getKpiMurid());
  await saveDelimaSnapshot(live, senarai, bilCapai);
}

/** Sasaran KPI murid (%) daripada metrik modul DELIMa; null jika belum ditetapkan. */
async function getKpiMurid(): Promise<number | null> {
  const [r] = await db
    .select({ value: analisisMetrics.value })
    .from(analisisMetrics)
    .where(and(eq(analisisMetrics.modul, "delima"), eq(analisisMetrics.key, "kpi_murid")))
    .limit(1);
  const n = Number(r?.value?.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

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
      murid23: analisisDelimaSnapshots.kadPct,
      guruGab: analisisDelimaSnapshots.guruGabPct,
      guru30: analisisDelimaSnapshots.guru30Pct,
      murid30: analisisDelimaSnapshots.murid30Pct,
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
      murid23: r.murid23,
      guruGab: r.guruGab,
      guru30: r.guru30,
      murid30: r.murid30,
    };
  });
}

export async function deleteDelimaSnapshot(id: number): Promise<void> {
  await db.delete(analisisDelimaSnapshots).where(eq(analisisDelimaSnapshots.id, id));
}
