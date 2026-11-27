/**
 * Simpan snapshot DELIMa d3 (ringkasan PPD + sekolah, 1 Jan → `tarikh`) — teras yang dikongsi oleh
 * skrip `db:import-delima-d3` (CSV) dan penanda d3 (`lib/actions/delima-d3.ts`).
 *
 * Semakan: jumlah sekolah = angka PPD; setiap nama sekolah dipadankan kepada kod (rujukan = senarai
 * sekolah snapshot terbaharu). Satu snapshot bagi setiap bulan (`period` YYYY-MM): simpan semula
 * dalam bulan yang sama menggantikan angka, jadi jadual tidak membesar dengan kekerapan kemas kini.
 * Pemanggil bertanggungjawab membatalkan cache `home` selepas simpan.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisDelimaSchools, analisisDelimaSnapshots, analisisMetrics } from "@/lib/schema";
import { DELIMA_D3_SUMBER, padankanKod, semakJumlah, type D3Data, type D3Pop } from "./delima-d3-parse";
import { tahapDariPeratus } from "./delima-merge";

const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"];

export type RingkasanD3 = {
  period: string;
  tempoh: string;
  bilSekolah: number;
  bilCapai: number | null;
  guru: D3Pop;
  murid: D3Pop;
  /** Snapshot bulan yang sama sebelum ini (akan diganti), jika ada. */
  sebelum: { tempoh: string; guru: D3Pop; murid: D3Pop } | null;
  /** Diisi selepas simpan. */
  disimpan: { id: number; dicipta: boolean } | null;
};

/** Ralat semakan data (mesej selamat dipaparkan kepada pegawai). */
export class RalatDataD3 extends Error {}

export async function prosesDelimaD3(data: D3Data, tarikh: string, simpan: boolean): Promise<RingkasanD3> {
  const m = tarikh.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new RalatDataD3("Tarikh akhir data mesti YYYY-MM-DD.");
  const [, tahun, bulan, hari] = m;
  const period = `${tahun}-${bulan}`;
  const tempoh = `1 Jan – ${Number(hari)} ${BULAN[Number(bulan) - 1]} ${tahun}`;

  const ralatJumlah = semakJumlah(data);
  if (ralatJumlah.length > 0) {
    throw new RalatDataD3(`Jumlah sekolah tidak sama dengan angka PPD:\n  ${ralatJumlah.join("\n  ")}`);
  }

  // Rujukan kod sekolah: senarai sekolah snapshot terbaharu yang ada baris sekolah.
  const [rujukanSnap] = await db
    .select({ id: analisisDelimaSnapshots.id })
    .from(analisisDelimaSnapshots)
    .where(sql`exists (select 1 from ${analisisDelimaSchools} s where s.snapshot_id = ${analisisDelimaSnapshots.id})`)
    .orderBy(desc(analisisDelimaSnapshots.period))
    .limit(1);
  if (!rujukanSnap) throw new RalatDataD3("Tiada snapshot rujukan dengan senarai sekolah.");
  const rujukan = await db
    .select({
      kod: analisisDelimaSchools.kod,
      nama: analisisDelimaSchools.nama,
      guruJumlah: analisisDelimaSchools.guruJumlah,
      muridJumlah: analisisDelimaSchools.muridJumlah,
    })
    .from(analisisDelimaSchools)
    .where(eq(analisisDelimaSchools.snapshotId, rujukanSnap.id));
  const { padan, tiada } = padankanKod(data.sekolah, rujukan);
  if (tiada.length > 0) throw new RalatDataD3(`Nama sekolah tiada padanan kod:\n  ${tiada.join("\n  ")}`);

  const [kpi] = await db
    .select({ value: analisisMetrics.value })
    .from(analisisMetrics)
    .where(and(eq(analisisMetrics.modul, "delima"), eq(analisisMetrics.key, "kpi_murid")))
    .limit(1);
  const kpiMurid = Number(kpi?.value?.replace(",", "."));
  const bilCapai =
    Number.isFinite(kpiMurid) && kpiMurid > 0 ? padan.filter((s) => s.murid.peratus >= kpiMurid).length : null;

  const [ada] = await db
    .select({
      id: analisisDelimaSnapshots.id,
      tempoh: analisisDelimaSnapshots.tempoh,
      guruAktif: analisisDelimaSnapshots.guruAktif,
      guruJumlah: analisisDelimaSnapshots.guruJumlah,
      guruPct: analisisDelimaSnapshots.guruPct,
      muridAktif: analisisDelimaSnapshots.muridAktif,
      muridJumlah: analisisDelimaSnapshots.muridJumlah,
      muridPct: analisisDelimaSnapshots.muridPct,
    })
    .from(analisisDelimaSnapshots)
    .where(eq(analisisDelimaSnapshots.period, period))
    .limit(1);

  const { guru, murid } = data.daerah;
  const ringkasan: RingkasanD3 = {
    period,
    tempoh,
    bilSekolah: padan.length,
    bilCapai,
    guru,
    murid,
    sebelum: ada
      ? {
          tempoh: ada.tempoh,
          guru: { aktif: ada.guruAktif, jumlah: ada.guruJumlah, peratus: ada.guruPct },
          murid: { aktif: ada.muridAktif, jumlah: ada.muridJumlah, peratus: ada.muridPct },
        }
      : null,
    disimpan: null,
  };
  if (!simpan) return ringkasan;

  const values = {
    period,
    tempoh,
    daerah: "manjung",
    sumberUrl: DELIMA_D3_SUMBER,
    capturedOn: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" }),
    guruAktif: guru.aktif,
    guruJumlah: guru.jumlah,
    guruPct: guru.peratus,
    muridAktif: murid.aktif,
    muridJumlah: murid.jumlah,
    muridPct: murid.peratus,
    // Kad sasaran / 3.0 / gabungan DELIMa Perak tidak berkaitan dengan sumber d3.
    kadAktif: null,
    kadJumlah: null,
    kadPct: null,
    kadSasaran: null,
    bilSekolah: padan.length,
    bilCapai,
    guru30Aktif: null,
    guru30Jumlah: null,
    guru30Pct: null,
    murid30Aktif: null,
    murid30Jumlah: null,
    murid30Pct: null,
    guruGabAktif: null,
    guruGabJumlah: null,
    guruGabPct: null,
  };

  ringkasan.disimpan = await db.transaction(async (tx) => {
    const [kini] = await tx
      .select({ id: analisisDelimaSnapshots.id })
      .from(analisisDelimaSnapshots)
      .where(eq(analisisDelimaSnapshots.period, period))
      .limit(1);
    let id: number;
    if (kini) {
      id = kini.id;
      await tx
        .update(analisisDelimaSnapshots)
        .set({ ...values, updatedAt: sql`now()` })
        .where(eq(analisisDelimaSnapshots.id, id));
    } else {
      [{ id }] = await tx
        .insert(analisisDelimaSnapshots)
        .values(values)
        .returning({ id: analisisDelimaSnapshots.id });
    }
    await tx.delete(analisisDelimaSchools).where(eq(analisisDelimaSchools.snapshotId, id));
    await tx.insert(analisisDelimaSchools).values(
      padan.map((s) => ({
        snapshotId: id,
        kod: s.kod,
        nama: s.nama.replace(/\s*\[\d+\]\s*/g, " ").trim(),
        guruAktif: s.guru.aktif,
        guruJumlah: s.guru.jumlah,
        guruPct: s.guru.peratus,
        guruTahap: tahapDariPeratus(s.guru.peratus),
        muridAktif: s.murid.aktif,
        muridJumlah: s.murid.jumlah,
        muridPct: s.murid.peratus,
        muridTahap: tahapDariPeratus(s.murid.peratus),
      })),
    );
    return { id, dicipta: !kini };
  });
  return ringkasan;
}
