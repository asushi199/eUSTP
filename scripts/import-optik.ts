import "./load-env";
import { revalidateSite } from "./revalidate-site";
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import {
  bersihNama,
  binaSnapshotOptik,
  chartLabelFromDate,
  type OptikGuruSumber,
} from "../lib/analisis/optik-parse";

/**
 * Import snapshot AI Tools (OPTIK) PPD Manjung daripada eksport DELIMa Perak/Kebangsaan.
 * Tiada muat naik admin — data sentiasa melalui skrip ini (Claude jalankan setiap kali ada fail baharu).
 *
 * Fail sumber (letak di mana-mana, hantar laluan penuh):
 *   --guru-belum   belum-ai-tools-guru-DDMMYY.csv    (email,name,jpn,ppd,kodsekolah,nama_institusi)
 *   --murid-belum  belum-ai-tools-murid-DDMMYY.csv   (format sama; sangat besar → dibaca strim)
 *   --login-belum  PERAK belum-login-guru-DDMMYY.csv (Nama,Email,Jenis Pengguna,JPN,PPD,Kod Sekolah,...)
 *   --xlsx         Pengguna_Murid,_Guru_dan_CM_Paling_Aktif_Perak_*.xlsx
 *   --tarikh       YYYY-MM-DD (tarikh akhir data)
 *   --dry-run      cetak ringkasan sahaja, tiada tulis DB / fail
 *
 * Hanya baris PPD MANJUNG diambil. E-mel hanya untuk padanan dalam memori — TIDAK disimpan.
 * Fail ringkasan sekolah (tanpa nama individu) ditulis ke scripts/data/analisis-optik-<tarikh>.csv.
 *
 * Guna: npm run db:import-optik -- --guru-belum <f> --murid-belum <f> --login-belum <f> --xlsx <f> --tarikh 2026-10-31
 */

const PPD = "PPD MANJUNG";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function perluFail(name: string): string {
  const v = arg(name);
  if (!v) throw new Error(`Perlu --${name} <fail>`);
  if (!existsSync(v)) throw new Error(`Fail tiada: ${v}`);
  return v;
}

/** Pemisah CSV satu baris (sokong petikan berganda). */
function pecah(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

async function bacaCsv(
  fail: string,
  cb: (get: (col: string) => string) => void,
): Promise<number> {
  const rl = createInterface({ input: createReadStream(fail, { encoding: "utf8" }), crlfDelay: Infinity });
  let head: string[] | null = null;
  let n = 0;
  for await (const raw of rl) {
    const line = n === 0 ? raw.replace(/^﻿/, "") : raw;
    if (!line.trim()) continue;
    const cells = pecah(line);
    if (!head) {
      head = cells.map((h) => h.trim().toLowerCase());
      n++;
      continue;
    }
    n++;
    cb((col) => {
      const i = head!.indexOf(col);
      return i >= 0 ? (cells[i] ?? "").trim() : "";
    });
  }
  return n - 1;
}

function bacaXlsx(fail: string) {
  // xlsx ialah CJS; require terus supaya tidak perlu esModuleInterop dalam skrip.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx") as typeof import("xlsx");
  const wb = XLSX.read(readFileSync(fail), { type: "buffer", cellDates: false });
  const helai = (nama: string) => {
    const ws = wb.Sheets[nama];
    if (!ws) throw new Error(`Helaian tiada dalam xlsx: "${nama}" (ada: ${wb.SheetNames.join(", ")})`);
    return (XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true, blankrows: false }) as unknown[][]).slice(
      1,
    );
  };
  return { aktif: helai("Paling Aktif Guru dan Murid"), ai: helai("Paling Aktif AI Tools") };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const tarikh = arg("tarikh") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarikh)) throw new Error("Perlu --tarikh YYYY-MM-DD");
  const guruBelumFail = perluFail("guru-belum");
  const muridBelumFail = perluFail("murid-belum");
  const loginBelumFail = perluFail("login-belum");
  const xlsxFail = perluFail("xlsx");

  const belumAi: OptikGuruSumber[] = [];
  await bacaCsv(guruBelumFail, (g) => {
    if (g("ppd").toUpperCase() !== PPD) return;
    belumAi.push({ email: g("email"), kod: g("kodsekolah"), nama: g("name") });
  });

  const belumLogin: OptikGuruSumber[] = [];
  await bacaCsv(loginBelumFail, (g) => {
    if (g("ppd").toUpperCase() !== PPD) return;
    if (g("status").toLowerCase() !== "belum_login") return;
    belumLogin.push({ email: g("email"), kod: g("kod sekolah"), nama: g("nama") });
  });

  const muridBelum = new Map<string, number>();
  const jumlahMuridFail = await bacaCsv(muridBelumFail, (g) => {
    if (g("ppd").toUpperCase() !== PPD) return;
    const kod = g("kodsekolah").toUpperCase();
    muridBelum.set(kod, (muridBelum.get(kod) ?? 0) + 1);
  });

  const x = bacaXlsx(xlsxFail);
  const aktif: OptikGuruSumber[] = [];
  for (const r of x.aktif) {
    if (String(r[4]).toUpperCase() !== PPD || r[1] !== "Guru") continue;
    aktif.push({ email: String(r[0]), kod: String(r[5]), nama: String(r[2]) });
  }
  const ai: (OptikGuruSumber & { hari: number })[] = [];
  const muridAi = new Map<string, number>();
  for (const r of x.ai) {
    if (String(r[4]).toUpperCase() !== PPD) continue;
    if (r[1] === "Guru") {
      ai.push({ email: String(r[0]), kod: String(r[5]), nama: String(r[2]), hari: Number(r[8]) || 0 });
    } else if (r[1] === "Murid") {
      const kod = String(r[5]).toUpperCase();
      muridAi.set(kod, (muridAi.get(kod) ?? 0) + 1);
    }
  }

  const { db } = await import("../lib/db");
  const { analisisDelimaSchools, analisisDelimaSnapshots, schools: schoolTable } = await import("../lib/schema");
  const { desc, eq, sql } = await import("drizzle-orm");

  const [rujSnap] = await db
    .select({ id: analisisDelimaSnapshots.id })
    .from(analisisDelimaSnapshots)
    .where(sql`exists (select 1 from ${analisisDelimaSchools} s where s.snapshot_id = ${analisisDelimaSnapshots.id})`)
    .orderBy(desc(analisisDelimaSnapshots.period))
    .limit(1);
  const muridRujukan = new Map<string, number>();
  if (rujSnap) {
    const rows = await db
      .select({ kod: analisisDelimaSchools.kod, murid: analisisDelimaSchools.muridJumlah })
      .from(analisisDelimaSchools)
      .where(eq(analisisDelimaSchools.snapshotId, rujSnap.id));
    for (const r of rows) muridRujukan.set(r.kod.toUpperCase(), r.murid ?? 0);
  }
  const namaSekolah = new Map<string, string>(
    (await db.select({ code: schoolTable.code, name: schoolTable.name }).from(schoolTable)).map((r) => [
      r.code.toUpperCase(),
      bersihNama(r.name),
    ]),
  );

  const hasil = binaSnapshotOptik({ aktif, ai, belumAi, belumLogin, muridAi, muridBelum, muridRujukan, namaSekolah });

  // Semakan silang — cetak amaran, bukan henti, kecuali tiada guru langsung.
  const aiKunci = new Set(ai.map((g) => g.email.toLowerCase()));
  const bertindih = belumAi.filter((g) => aiKunci.has(g.email.toLowerCase())).length;
  const kodTakDikenal = [...new Set(hasil.schools.map((s) => s.schoolCode))].filter((k) => !namaSekolah.has(k));
  const muridTanpaGuru = [...new Set([...muridAi.keys(), ...muridBelum.keys()])].filter(
    (k) => !hasil.schools.some((s) => s.schoolCode === k),
  );
  console.log(
    [
      `Tarikh: ${tarikh} (${chartLabelFromDate(tarikh)})`,
      `Guru: ${hasil.selesaiBil}/${hasil.totalBil} selesai = ${hasil.selesaiPct}% · belum ${hasil.belumBil} (belum log masuk ${hasil.guruBelumLogin})`,
      `  sumber: aktif ${aktif.length}, guna AI ${ai.length}, belum AI ${belumAi.length}, belum login ${belumLogin.length}`,
      `Murid: ${hasil.muridAi}/${hasil.muridJumlah} guna AI = ${hasil.muridPct}% (belum AI dalam fail: ${[...muridBelum.values()].reduce((a, b) => a + b, 0)} drpd ${jumlahMuridFail} baris negara)`,
      `Sekolah: ${hasil.schools.length} (selesai ${hasil.sekolahSelesai}, belum ${hasil.sekolahBelum})`,
      bertindih > 0 ? `AMARAN: ${bertindih} guru ada dalam senarai guna & belum guna AI Tools` : "Semakan silang guru: OK",
      kodTakDikenal.length ? `AMARAN: kod tiada dalam jadual schools: ${kodTakDikenal.join(", ")}` : "Semua kod sekolah dikenali",
      muridTanpaGuru.length ? `AMARAN: murid tanpa guru dalam sumber: ${muridTanpaGuru.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  if (dryRun) {
    console.log("--dry-run: tiada apa ditulis.");
    process.exit(0);
  }

  const csvFail = join(__dirname, "data", `analisis-optik-${tarikh}.csv`);
  mkdirSync(dirname(csvFail), { recursive: true });
  writeFileSync(csvFail, hasil.csv, "utf8");

  const { insertOptikSnapshot, syncOptikCurrentMetrics } = await import("../lib/analisis/optik-store");
  await insertOptikSnapshot({
    parsed: hasil,
    capturedOn: tarikh,
    chartLabel: chartLabelFromDate(tarikh),
    filename: `DELIMa AI Tools PPD Manjung ${tarikh}`,
    userId: null,
    makeCurrent: true,
  });
  await syncOptikCurrentMetrics(tarikh, hasil);
  console.log(`Snapshot disimpan. Ringkasan sekolah: ${csvFail}`);
  await revalidateSite(["home"]);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
