import "./load-env";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import * as schema from "../lib/schema";

/**
 * Import satu kali data dashboard lama (Google Sheet CSV export) ke Postgres.
 * CSV diletakkan dalam scripts/data/ (export dari Sheet asal). Idempoten:
 * setiap jadual sasaran dikosongkan dahulu (app_settings pula di-upsert).
 *
 * Guna: npm run db:seed-dashboard
 */

const DATA_DIR = join(__dirname, "data");

/* ---------- CSV parser (port dari oscSheetCsv.js) ---------- */

function parseCsvMatrix(csvText: string): string[][] {
  const text = String(csvText ?? "").replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;

  const pushCell = () => {
    row.push(cur);
    cur = "";
  };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "" && rows.length === 0) return;
    if (row.some((c) => String(c).trim() !== "") || row.length > 1) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      pushCell();
      i += 1;
      continue;
    }
    if (c === "\n") {
      pushCell();
      pushRow();
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      if (text[i] === "\n") i += 1;
      pushCell();
      pushRow();
      continue;
    }
    cur += c;
    i += 1;
  }
  pushCell();
  if (row.some((c) => String(c).trim() !== "")) pushRow();

  return rows;
}

function num(v: unknown): number | null {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

/** Nilai KV = sel bukan kosong pertama selepas lajur kunci (elak lajur sisa Sheet). */
function firstValueCell(row: string[]): string {
  for (let j = 1; j < row.length; j++) {
    const t = String(row[j] ?? "").trim();
    if (t) return t;
  }
  return "";
}

function readCsv(name: string): string[][] | null {
  const p = join(DATA_DIR, name);
  if (!existsSync(p)) {
    console.warn(`  [langkau] ${name} tiada`);
    return null;
  }
  return parseCsvMatrix(readFileSync(p, "utf8"));
}

/* ---------- Kad kandungan ---------- */

type Topik = (typeof schema.kandunganTopik.enumValues)[number];
type CardType = (typeof schema.kandunganCardType.enumValues)[number];

function normType(raw: string): CardType {
  const t = raw.trim().toLowerCase();
  if (["gdoc", "docs", "google doc", "google_docs"].includes(t)) return "gdoc";
  if (t === "canva") return "canva";
  if (t === "youtube" || t === "yt") return "youtube";
  if (["image", "img", "gambar"].includes(t)) return "image";
  if (["embed", "iframe", "looker", "looker studio"].includes(t)) return "embed";
  if (t === "link" || t === "pautan") return "link";
  return "pdf";
}

function colIndex(headers: string[], ...names: string[]): number {
  const norm = headers.map((h) => String(h ?? "").trim().toLowerCase().replace(/\s+/g, " "));
  for (const n of names) {
    const i = norm.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

function parseCards(matrix: string[][], topik: Topik) {
  const h = matrix[0];
  const idx = {
    subtopikKey: colIndex(h, "subtopik_key"),
    subtopikTitle: colIndex(h, "subtopik_title"),
    subtopikSort: colIndex(h, "subtopik_sort"),
    subtopikBlurb: colIndex(h, "subtopik_blurb"),
    subtopikIcon: colIndex(h, "subtopik_icon", "icon", "ikon", "emoji"),
    sort: colIndex(h, "sort", "susunan", "no"),
    title: colIndex(h, "title", "tajuk", "nama"),
    url: colIndex(h, "url", "link", "pautan"),
    type: colIndex(h, "type", "jenis", "format"),
    blurb: colIndex(h, "blurb", "catatan", "nota", "keterangan"),
    previewUrl: colIndex(h, "preview_url", "preview url", "preview", "thumbnail"),
  };
  if (idx.title < 0 || idx.url < 0) {
    console.warn(`  [amaran] ${topik}: tiada lajur title/url — langkau`);
    return [];
  }
  const cell = (r: string[], i: number) => (i >= 0 ? String(r[i] ?? "").trim() : "");
  const out: (typeof schema.kandunganCards.$inferInsert)[] = [];
  for (let ri = 1; ri < matrix.length; ri++) {
    const r = matrix[ri];
    const title = cell(r, idx.title);
    const url = cell(r, idx.url);
    if (!title || !url) continue;
    out.push({
      topik,
      subtopikKey: cell(r, idx.subtopikKey),
      subtopikTitle: cell(r, idx.subtopikTitle),
      subtopikSort: num(cell(r, idx.subtopikSort)) ?? 999,
      subtopikBlurb: cell(r, idx.subtopikBlurb),
      subtopikIcon: cell(r, idx.subtopikIcon),
      sort: num(cell(r, idx.sort)) ?? 999,
      title,
      blurb: cell(r, idx.blurb),
      url,
      type: normType(cell(r, idx.type)),
      previewUrl: cell(r, idx.previewUrl),
    });
  }
  return out;
}

/* ---------- Main ---------- */

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditetapkan");
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  /* 1. Kad kandungan */
  const topikFiles: Array<[string, Topik]> = [
    ["osc-integrasi.csv", "integrasi"],
    ["osc-hebahan.csv", "hebahan"],
    ["osc-itm.csv", "itm"],
    ["osc-pembudayaan.csv", "pembudayaan"],
    ["osc-pemerkasaan.csv", "pemerkasaan"],
    ["bahan-sokongan.csv", "bahan_sokongan"],
  ];
  await db.delete(schema.kandunganCards);
  for (const [file, topik] of topikFiles) {
    const m = readCsv(file);
    if (!m || m.length < 2) continue;
    const cards = parseCards(m, topik);
    if (cards.length) await db.insert(schema.kandunganCards).values(cards);
    console.log(`kandungan_cards ← ${topik}: ${cards.length} baris`);
  }

  /* 2. Analisis */
  await db.delete(schema.analisisMetrics);
  await db.delete(schema.analisisMonthly);
  await db.delete(schema.analisisBreakdown);

  type Modul = (typeof schema.analisisModul.enumValues)[number];
  const kvModuls: Array<[string, Modul]> = [
    ["analisis-delima.csv", "delima"],
    ["analisis-dcs.csv", "dcs"],
    ["analisis-ains.csv", "ains"],
    ["analisis-pensijilan.csv", "pensijilan"],
    ["analisis-optik.csv", "optik"],
  ];

  for (const [file, modul] of kvModuls) {
    const m = readCsv(file);
    if (!m) continue;
    const metrics: (typeof schema.analisisMetrics.$inferInsert)[] = [];
    const monthly: (typeof schema.analisisMonthly.$inferInsert)[] = [];
    const breakdown: (typeof schema.analisisBreakdown.$inferInsert)[] = [];
    const seen = new Set<string>();
    let khidmatBantuSeq = 0;
    let monthMode = false;
    let monthSort = 0;

    for (const row of m) {
      if (!row?.length) continue;
      const c0 = String(row[0] ?? "").trim();
      const c0l = c0.toLowerCase();

      if (c0l === "month_label") {
        monthMode = true;
        continue;
      }
      if (monthMode) {
        if (!c0) continue;
        monthly.push({
          modul,
          monthLabel: c0,
          guruPct: num(row[1]),
          muridPct: num(row[2]),
          includeChart: ["yes", "true", "1", "y", ""].includes(
            String(row[3] ?? "yes").trim().toLowerCase(),
          ),
          chartLabel: String(row[4] ?? "").trim(),
          sort: monthSort++,
        });
        continue;
      }
      if (c0l === "category") {
        const kindRaw = String(row[1] ?? "").trim().toLowerCase();
        const kind =
          kindRaw === "location" || kindRaw === "lokasi"
            ? "lokasi"
            : kindRaw === "school" || kindRaw === "sekolah" || kindRaw === "jenis"
              ? "sekolah"
              : kindRaw;
        const label = String(row[2] ?? "").trim();
        const value = num(row[3]);
        if (kind && label && value != null) {
          breakdown.push({ modul, kind, label, value, sort: breakdown.length });
        }
        continue;
      }
      if (!c0 || (c0l === "key" && String(row[1] ?? "").trim().toLowerCase() === "value")) {
        continue;
      }
      const v = firstValueCell(row);
      if (!v) continue;
      /* Dua baris khidmat_bantu dalam Sheet DELIMa (kali, kemudian bil. sekolah). */
      let key = c0;
      if (modul === "delima" && c0l === "khidmat_bantu") {
        khidmatBantuSeq += 1;
        key = khidmatBantuSeq === 1 ? "khidmat_bantu_kali" : "khidmat_bantu_sekolah";
      }
      if (seen.has(key)) continue;
      seen.add(key);
      metrics.push({ modul, key, value: v });
    }

    if (metrics.length) await db.insert(schema.analisisMetrics).values(metrics);
    if (monthly.length) await db.insert(schema.analisisMonthly).values(monthly);
    if (breakdown.length) await db.insert(schema.analisisBreakdown).values(breakdown);
    console.log(
      `analisis ← ${modul}: ${metrics.length} metrik, ${monthly.length} bulanan, ${breakdown.length} pecahan`,
    );
  }

  /* 3. Maklumat Asas → app_settings + pegawai */
  const mk = readCsv("maklumat-asas.csv");
  if (mk) {
    let staffMode = false;
    const settings: Array<[string, string]> = [];
    const staff: (typeof schema.pegawai.$inferInsert)[] = [];
    for (const row of mk) {
      const c0 = String(row[0] ?? "").trim();
      const c0l = c0.toLowerCase();
      if (c0l === "nama" && String(row[1] ?? "").trim().toLowerCase() === "jawatan") {
        staffMode = true;
        continue;
      }
      if (!c0 || (c0l === "key" && String(row[1] ?? "").trim().toLowerCase() === "value")) {
        continue;
      }
      if (staffMode) {
        staff.push({
          nama: c0,
          jawatan: String(row[1] ?? "").trim(),
          telefon: String(row[2] ?? "").trim(),
          detailUrl: String(row[3] ?? "").trim(),
          photoUrl: String(row[4] ?? "").trim(),
          sort: staff.length,
        });
      } else {
        const v = firstValueCell(row);
        if (v) settings.push([c0, v]);
      }
    }
    /* Imej statik disalin ke public/maklumat/ — guna laluan tempatan, bukan Drive. */
    const overrides = new Map<string, string>([
      ["carta_image_url", "/maklumat/carta-organisasi-ustp-ppd-manjung.png"],
      ["pkg_image_url", "/maklumat/maklumat-pkg-coe-daerah-manjung.png"],
    ]);
    for (const [key, rawValue] of settings) {
      const value = overrides.get(key) ?? rawValue;
      await db
        .insert(schema.appSettings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: schema.appSettings.key,
          set: { value, updatedAt: sql`now()` },
        });
    }
    await db.delete(schema.pegawai);
    if (staff.length) await db.insert(schema.pegawai).values(staff);
    console.log(`app_settings ← ${settings.length} kunci; pegawai ← ${staff.length} orang`);
  }

  /* 4. Laman web sekolah → schools.website (padan ikut kod) */
  const lw = readCsv("laman-web.csv");
  if (lw && lw.length > 1) {
    const h = lw[0];
    const ci = {
      code: colIndex(h, "code", "kod sekolah", "kod"),
      url: colIndex(h, "url", "website", "pautan", "laman web"),
    };
    let ok = 0;
    for (let i = 1; i < lw.length; i++) {
      const code = String(lw[i][ci.code] ?? "").trim().toUpperCase();
      const website = String(lw[i][ci.url] ?? "").trim();
      if (!code || !website) continue;
      const res = await db
        .update(schema.schools)
        .set({ website, updatedAt: sql`now()` })
        .where(eq(schema.schools.code, code));
      if ((res as unknown as { count?: number }).count === 0) {
        console.warn(`  [amaran] kod sekolah tidak dijumpai: ${code}`);
      } else {
        ok++;
      }
    }
    console.log(`schools.website ← ${ok} sekolah dikemas kini`);
  } else {
    console.log("laman-web.csv kosong — tiada website diimport");
  }

  await client.end();
  console.log("Seed dashboard selesai.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
