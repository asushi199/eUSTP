/** Penghuraian CSV "guru belum log masuk DELIMa" (tulen, tanpa I/O). */
import { namaPpd, parseCsv } from "./delima-csv-parse";

export type DelimaBelumLoginRow = { kod: string; nama: string };

/**
 * Lajur dibaca: email (hanya untuk buang pendua — TIDAK disimpan), name, ppd, kodsekolah,
 * login_status (jika ada, hanya `belum_login` diambil). Hanya baris PPD yang diminta.
 */
export function parseBelumLoginCsv(text: string, daerahSlug: string): DelimaBelumLoginRow[] {
  const [head, ...isi] = parseCsv(text.replace(/^﻿/, ""));
  if (!head) throw new Error("Fail kosong");
  const col = (n: string) => head.findIndex((h) => h.trim().toLowerCase() === n);
  const iName = col("name");
  const iPpd = col("ppd");
  const iKod = col("kodsekolah");
  const iEmail = col("email");
  const iStatus = col("login_status");
  if (iName < 0 || iPpd < 0 || iKod < 0) {
    throw new Error("Format tidak dikenali — perlu lajur name, ppd dan kodsekolah");
  }
  const ppd = namaPpd(daerahSlug);
  const seen = new Set<string>();
  const out: DelimaBelumLoginRow[] = [];
  for (const r of isi) {
    if ((r[iPpd] ?? "").trim().toUpperCase() !== ppd) continue;
    if (iStatus >= 0 && (r[iStatus] ?? "").trim().toLowerCase() !== "belum_login") continue;
    const nama = (r[iName] ?? "").trim().replace(/\s+/g, " ");
    const kod = (r[iKod] ?? "").trim().toUpperCase();
    if (!nama || !kod) continue;
    const key = iEmail >= 0 && r[iEmail]?.trim() ? r[iEmail].trim().toLowerCase() : `${kod}|${nama}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kod, nama });
  }
  out.sort((a, b) => a.kod.localeCompare(b.kod) || a.nama.localeCompare(b.nama, "ms"));
  return out;
}
