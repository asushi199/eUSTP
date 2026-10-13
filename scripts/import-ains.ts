import "./load-env";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  bulanDariNamaFail,
  gabungSekolahBulan,
  parseAinsMurid,
  parseAinsSekolah,
} from "../lib/analisis/ains-parse";

/**
 * Import data Program Ains (PPD Manjung sahaja) daripada CSV bulanan.
 * Dua folder: fail pengguna/murid (`user_*.csv`) dan fail ringkasan sekolah (`school_*.csv`);
 * bulan dikesan daripada nama fail. Idempoten: bulan yang sama diganti.
 *
 * Guna: npm run db:import-ains -- "<folder user>" "<folder school>" [tahun=2026]
 */

const BATCH = 2000;

async function main() {
  const [userDir, schoolDir, tahunArg] = process.argv.slice(2);
  if (!userDir || !schoolDir) {
    throw new Error('Guna: db:import-ains -- "<folder user>" "<folder school>" [tahun]');
  }
  const tahun = Number(tahunArg ?? 2026);
  if (!Number.isInteger(tahun)) throw new Error("Tahun tidak sah.");

  const { db } = await import("../lib/db");
  const { analisisAinsMurid, analisisAinsMuridBulanan, analisisAinsSekolah, schools } =
    await import("../lib/schema");
  const { and, eq, inArray, sql } = await import("drizzle-orm");

  const failBulan = (dir: string) => {
    const peta = new Map<number, string>();
    for (const f of readdirSync(dir)) {
      if (!f.toLowerCase().endsWith(".csv")) continue;
      const b = bulanDariNamaFail(f);
      if (b == null) throw new Error(`Bulan tidak dikenali daripada nama fail: ${f}`);
      if (peta.has(b)) throw new Error(`Dua fail untuk bulan ${b} dalam ${dir}`);
      peta.set(b, join(dir, f));
    }
    return peta;
  };
  const userFiles = failBulan(userDir);
  const schoolFiles = failBulan(schoolDir);

  const direktori = await db.select({ code: schools.code, name: schools.name }).from(schools);
  const namaDir = new Map(direktori.map((r) => [r.code, r.name]));

  for (const bulan of [...userFiles.keys()].sort((a, b) => a - b)) {
    const userPath = userFiles.get(bulan)!;
    const schoolPath = schoolFiles.get(bulan);
    const murid = parseAinsMurid(readFileSync(userPath, "utf8"));
    const sekolah = gabungSekolahBulan(
      schoolPath ? parseAinsSekolah(readFileSync(schoolPath, "utf8")) : [],
      murid,
    );

    // Satu e-mel mungkin muncul dua kali dalam satu fail: ambil baris terakhir.
    const unik = new Map(murid.map((m) => [m.email, m]));

    await db.transaction(async (tx) => {
      const senarai = [...unik.values()];
      for (let i = 0; i < senarai.length; i += BATCH) {
        const sel = senarai.slice(i, i + BATCH);
        await tx
          .insert(analisisAinsMurid)
          .values(sel.map((m) => ({ email: m.email, nama: m.nama })))
          .onConflictDoUpdate({
            target: analisisAinsMurid.email,
            set: { nama: sql`excluded.nama` },
          });
      }
      const idPeta = new Map<string, number>();
      for (let i = 0; i < senarai.length; i += BATCH) {
        const rows = await tx
          .select({ id: analisisAinsMurid.id, email: analisisAinsMurid.email })
          .from(analisisAinsMurid)
          .where(inArray(analisisAinsMurid.email, senarai.slice(i, i + BATCH).map((m) => m.email)));
        for (const r of rows) idPeta.set(r.email, r.id);
      }

      await tx
        .delete(analisisAinsMuridBulanan)
        .where(and(eq(analisisAinsMuridBulanan.tahun, tahun), eq(analisisAinsMuridBulanan.bulan, bulan)));
      for (let i = 0; i < senarai.length; i += BATCH) {
        await tx.insert(analisisAinsMuridBulanan).values(
          senarai.slice(i, i + BATCH).map((m) => ({
            muridId: idPeta.get(m.email)!,
            tahun,
            bulan,
            kod: m.kod,
            ditolak: m.ditolak,
            lulus: m.lulus,
            eng: m.eng,
            bm: m.bm,
            lain: m.lain,
            mukaSurat: m.mukaSurat,
            star: m.star,
          })),
        );
      }

      await tx
        .delete(analisisAinsSekolah)
        .where(and(eq(analisisAinsSekolah.tahun, tahun), eq(analisisAinsSekolah.bulan, bulan)));
      await tx.insert(analisisAinsSekolah).values(
        sekolah.map((s) => ({
          tahun,
          bulan,
          kod: s.kod,
          nama: namaDir.get(s.kod) ?? s.nama,
          jenis: s.jenis,
          tahap: s.tahap,
          murid: s.murid,
          ditolak: s.ditolak,
          lulus: s.lulus,
          purata: s.purata,
          muridMembaca: s.muridMembaca,
          eng: s.eng,
          bm: s.bm,
          lain: s.lain,
          mukaSurat: s.mukaSurat,
          star: s.star,
        })),
      );
    });
    console.log(
      `${tahun}-${String(bulan).padStart(2, "0")}: ${sekolah.length} sekolah, ${unik.size} murid` +
        (schoolPath ? "" : " (tiada fail sekolah)"),
    );
  }
  console.log("Import Ains selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
