/** Penghuraian CSV DELIMa 3.0 (tulen, tanpa I/O) — dipisahkan supaya boleh diuji. */

export type DelimaV30Pop = { aktif: number; jumlah: number; peratus: number };

export type DelimaV30 = {
  guru: Map<string, DelimaV30Pop>;
  murid: Map<string, DelimaV30Pop>;
  /** Jumlah daerah (hasil tambah semua sekolah dalam PPD). */
  jumlahGuru: DelimaV30Pop;
  jumlahMurid: DelimaV30Pop;
};

/** Pecah teks CSV kepada baris + medan (menyokong medan dalam petikan dan "" terlepas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

const nombor = (s: string | undefined) => Number((s ?? "").replace(/,/g, "").trim()) || 0;
const bulat1 = (n: number) => Math.round(n * 10) / 10;

function pop(aktif: number, jumlah: number): DelimaV30Pop {
  return { aktif, jumlah, peratus: jumlah > 0 ? bulat1((aktif / jumlah) * 100) : 0 };
}

/** "manjung" / "kuala-kangsar" → "PPD MANJUNG" / "PPD KUALA KANGSAR". */
export function namaPpd(daerahSlug: string): string {
  return `PPD ${daerahSlug.trim().replace(/[-_]+/g, " ").toUpperCase()}`;
}

/** Baris CSV satu PPD → peta kod sekolah (huruf besar) + jumlah daerah. */
export function ringkasCsvPpd(
  csv: string,
  ppd: string,
): { sekolah: Map<string, DelimaV30Pop>; jumlah: DelimaV30Pop } | null {
  const [head, ...isi] = parseCsv(csv);
  if (!head) return null;
  const col = (nama: string) => head.findIndex((h) => h.trim().toUpperCase() === nama);
  const iPpd = col("PPD");
  const iKod = col("KODSEKOLAH");
  const iAktif = col("PENGGUNA AKTIF");
  const iJumlah = col("TOTAL PENGGUNA");
  if ([iPpd, iKod, iAktif, iJumlah].some((i) => i < 0)) return null;

  const sekolah = new Map<string, DelimaV30Pop>();
  let a = 0;
  let j = 0;
  for (const r of isi) {
    if (r[iPpd]?.trim().toUpperCase() !== ppd) continue;
    const kod = r[iKod]?.trim().toUpperCase();
    if (!kod) continue;
    const aktif = nombor(r[iAktif]);
    const jumlah = nombor(r[iJumlah]);
    sekolah.set(kod, pop(aktif, jumlah));
    a += aktif;
    j += jumlah;
  }
  return sekolah.size > 0 ? { sekolah, jumlah: pop(a, j) } : null;
}

