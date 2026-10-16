import "./load-env";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import {
  DELIMA_D3_SUMBER,
  padankanKod,
  parseD3Csv,
  semakJumlah,
} from "../lib/analisis/delima-d3-parse";
import { tahapDariPeratus } from "../lib/analisis/delima-merge";

/**
 * Import snapshot DELIMa 3.0 daripada d3.delima.edu.my (Utama, tempoh 1 Jan → tarikh fail).
 * Tarikh akhir diambil daripada nama fail `delima-d3-YYYY-MM-DD.csv`; tempoh = 1 Jan tahun itu.
 * Disimpan sebagai snapshot bulanan (period YYYY-MM) dengan sumber_url d3 — cron DELIMa Perak
 * tidak menimpa baris ini. Idempoten: import semula bulan yang sama menggantikan angka.
 *
 * Guna: npm run db:import-delima-d3 -- scripts/data/delima-d3-2026-10-16.csv [--dry-run]
 */

const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis"];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fail = args.find((a) => !a.startsWith("--"));
  if (!fail) throw new Error("Guna: db:import-delima-d3 -- <fail.csv> [--dry-run]");
  const m = basename(fail).match(/(\d{4})-(\d{2})-(\d{2})\.csv$/i);
  if (!m) throw new Error("Nama fail mesti berakhir dengan YYYY-MM-DD.csv (tarikh akhir data).");
  const [, tahun, bulan, hari] = m;
  const period = `${tahun}-${bulan}`;
  const tempoh = `1 Jan – ${Number(hari)} ${BULAN[Number(bulan) - 1]} ${tahun}`;

  const data = parseD3Csv(readFileSync(fail, "utf8"));
  const ralatJumlah = semakJumlah(data);
  if (ralatJumlah.length > 0) throw new Error(`Jumlah tidak sepadan:\n  ${ralatJumlah.join("\n  ")}`);

  const { db } = await import("../lib/db");
  const { analisisDelimaSchools, analisisDelimaSnapshots, analisisMetrics } = await import("../lib/schema");
  const { and, desc, eq, sql } = await import("drizzle-orm");

  // Rujukan kod sekolah: senarai sekolah snapshot terbaharu (DELIMa Perak) yang ada baris sekolah.
  const [rujukanSnap] = await db
    .select({ id: analisisDelimaSnapshots.id })
    .from(analisisDelimaSnapshots)
    .where(sql`exists (select 1 from ${analisisDelimaSchools} s where s.snapshot_id = ${analisisDelimaSnapshots.id})`)
    .orderBy(desc(analisisDelimaSnapshots.period))
    .limit(1);
  if (!rujukanSnap) throw new Error("Tiada snapshot rujukan dengan senarai sekolah.");
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
  if (tiada.length > 0) throw new Error(`Nama sekolah tiada padanan kod:\n  ${tiada.join("\n  ")}`);

  const [kpi] = await db
    .select({ value: analisisMetrics.value })
    .from(analisisMetrics)
    .where(and(eq(analisisMetrics.modul, "delima"), eq(analisisMetrics.key, "kpi_murid")))
    .limit(1);
  const kpiMurid = Number(kpi?.value?.replace(",", "."));
  const bilCapai =
    Number.isFinite(kpiMurid) && kpiMurid > 0 ? padan.filter((s) => s.murid.peratus >= kpiMurid).length : null;

  const { guru, murid } = data.daerah;
  console.log(
    `${period} · ${tempoh} · ${padan.length} sekolah · guru ${guru.aktif}/${guru.jumlah} (${guru.peratus}%) · ` +
      `murid ${murid.aktif}/${murid.jumlah} (${murid.peratus}%) · capai KPI murid ${bilCapai ?? "—"}`,
  );
  if (dryRun) {
    console.log("--dry-run: tiada perubahan.");
    process.exit(0);
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  const values = {
    period,
    tempoh,
    daerah: "manjung",
    sumberUrl: DELIMA_D3_SUMBER,
    capturedOn: today,
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

  const hasil = await db.transaction(async (tx) => {
    const [ada] = await tx
      .select({ id: analisisDelimaSnapshots.id })
      .from(analisisDelimaSnapshots)
      .where(eq(analisisDelimaSnapshots.period, period))
      .limit(1);
    let id: number;
    if (ada) {
      id = ada.id;
      await tx.update(analisisDelimaSnapshots).set({ ...values, updatedAt: sql`now()` }).where(eq(analisisDelimaSnapshots.id, id));
    } else {
      [{ id }] = await tx.insert(analisisDelimaSnapshots).values(values).returning({ id: analisisDelimaSnapshots.id });
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
    return { id, created: !ada };
  });
  console.log(`Snapshot ${hasil.created ? "dicipta" : "dikemas kini"} (id ${hasil.id}).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
