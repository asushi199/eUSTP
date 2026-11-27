/**
 * Muatan penanda DELIMa d3 (`public/penanda/delima-d3.js`): penanda dijalankan dalam tab
 * d3.delima.edu.my pegawai yang sudah log masuk, membaca ringkasan PPD + setiap sekolah
 * (1 Jan → hari ini) lalu menghantarnya ke `/penanda/delima-d3#d=…`. Ringkasan sekolah sahaja —
 * tiada data individu. Modul tulen (tanpa I/O) supaya boleh diuji.
 */
import { z } from "zod";
import { d3Pop, type D3Baris, type D3Data } from "./delima-d3-parse";

/** Versi penanda terendah yang masih diterima (naikkan jika format muatan berubah). */
export const VERSI_PENANDA_D3_MIN = 1;

/** Kunci sessionStorage: muatan disimpan supaya tidak hilang semasa log masuk NEXa. */
export const KUNCI_MUATAN_D3 = "nexa-delima-d3-muatan";

const bil = z.number().int().min(0).max(5_000_000);
/** [nama, guru aktif, guru jumlah, murid aktif, murid jumlah] */
const baris = z.tuple([z.string().trim().min(2).max(200), bil, bil, bil, bil]);
const tarikhIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const muatanD3Schema = z.object({
  v: z.number().int().min(1),
  tarikh: tarikhIso,
  mula: tarikhIso,
  daerah: baris,
  sekolah: z.array(baris).min(1).max(400),
});

export type MuatanD3 = z.infer<typeof muatanD3Schema>;

export type HasilMuatanD3 =
  | { ok: true; data: D3Data; tarikh: string }
  | { ok: false; error: string };

const HARI_MS = 24 * 60 * 60 * 1000;

/** Tarikh hari ini di Malaysia (YYYY-MM-DD). */
export function hariIniKL(kini: Date = new Date()): string {
  return kini.toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

function keBaris([nama, ga, gj, ma, mj]: MuatanD3["daerah"]): D3Baris {
  return { nama, guru: d3Pop(ga, gj), murid: d3Pop(ma, mj) };
}

/**
 * Sahkan muatan penanda dan tukar kepada `D3Data`. `hariIni` = tarikh pelayan (KL): muatan mesti
 * baharu (beza ≤ 2 hari) supaya pautan lama tidak menimpa snapshot bulan lain.
 */
export function bacaMuatanD3(raw: unknown, hariIni: string = hariIniKL()): HasilMuatanD3 {
  const p = muatanD3Schema.safeParse(raw);
  if (!p.success) return { ok: false, error: "Data daripada penanda tidak lengkap atau rosak." };
  const m = p.data;
  if (m.v < VERSI_PENANDA_D3_MIN) {
    return { ok: false, error: "Penanda ini versi lama. Pasang semula penanda dari halaman admin." };
  }
  const t = Date.parse(`${m.tarikh}T00:00:00Z`);
  const h = Date.parse(`${hariIni}T00:00:00Z`);
  if (!Number.isFinite(t) || new Date(t).toISOString().slice(0, 10) !== m.tarikh) {
    return { ok: false, error: "Tarikh data tidak sah." };
  }
  if (Math.abs(t - h) > 2 * HARI_MS) {
    return { ok: false, error: "Data ini sudah lama. Klik penanda semula dalam tab DELIMa." };
  }
  if (m.mula !== `${m.tarikh.slice(0, 4)}-01-01`) {
    return { ok: false, error: "Tempoh data mesti bermula 1 Januari tahun semasa." };
  }
  const daerah = keBaris(m.daerah);
  const sekolah = m.sekolah.map(keBaris);
  if (!/\bPPD\b/i.test(daerah.nama)) return { ok: false, error: "Baris daerah mesti unit PPD." };
  const lebih = [daerah, ...sekolah].find((b) => b.guru.aktif > b.guru.jumlah || b.murid.aktif > b.murid.jumlah);
  if (lebih) return { ok: false, error: `Bilangan aktif melebihi jumlah bagi ${lebih.nama}.` };
  return { ok: true, data: { daerah, sekolah }, tarikh: m.tarikh };
}

/** Baca muatan daripada serpihan URL (`#d=<JSON dikod>`); null jika tiada/rosak. */
export function muatanDariSerpihan(hash: string): unknown | null {
  const m = hash.replace(/^#/, "").match(/(?:^|&)d=([^&]+)/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]!));
  } catch {
    return null;
  }
}
