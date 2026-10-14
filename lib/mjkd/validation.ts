import { z } from "zod";
import { isStatusMjkd, type StatusMjkd } from "./enums";

export const CATATAN_MIN = 30;
export const CATATAN_MAX = 2000;
export const PAUTAN_MAX = 500;
/** Gambar bukti setiap perkara (Google Drive). */
export const FOTO_BUKTI_MAKS = 3;
/** Had saiz satu gambar selepas dimampatkan di pelayar. */
export const FOTO_BUKTI_MAKS_BYTE = 2.5 * 1024 * 1024;
/** "drive/{fileId}" (rekod sedia ada) atau "drive/{fileId}~{hmac}" (baru dimuat naik). */
const PATH_FOTO = /^drive\/[A-Za-z0-9_-]{10,}(~[a-f0-9]{32})?$/;

/** Contoh 5W1H (pemegang tempat catatan). */
export const CONTOH_5W1H =
  "Contoh — Apa: Taklimat Matrik Pembelajaran kepada ibu bapa Tahun 4. Siapa: GB, PK Kurikulum dan 58 ibu bapa. Bila: 12 Mac 2026. Di mana: Dewan sekolah. Mengapa: Memberi kefahaman bahawa matrik bukan penanda aras kedudukan murid. Bagaimana: Taklimat 30 minit diikuti sesi soal jawab.";

/** Format gambar bukti yang sah (tandatangan disemak di pelayan, `lib/mjkd/foto-token.ts`). */
export function isPathFotoBukti(v: string): boolean {
  return PATH_FOTO.test(v);
}

function idFoto(path: string): string {
  return encodeURIComponent(path.replace(/^drive\//, "").replace(/~.*$/, ""));
}

/** URL gambar kecil Drive untuk <img> (lebar `sz` px). Menerima path atau token. */
export function urlFotoBukti(path: string, sz = 1200): string {
  return `https://drive.google.com/thumbnail?id=${idFoto(path)}&sz=w${sz}`;
}

/** Pautan buka fail Drive (saiz penuh). */
export function urlBukaFotoBukti(path: string): string {
  return `https://drive.google.com/file/d/${idFoto(path)}/view`;
}

export type PerkaraRujukan = { id: string; para: string };

const itemSchema = z.object({
  perkaraId: z.string().min(1),
  status: z.string(),
  catatan: z.string().max(CATATAN_MAX, "Catatan terlalu panjang."),
  pautanBukti: z.string().max(PAUTAN_MAX, "Pautan bukti terlalu panjang."),
  fotoBukti: z.array(z.string().max(200)).optional(),
});

const submissionShape = z.object({
  namaPengisi: z
    .string()
    .trim()
    .min(1, "Sila isi nama pengisi.")
    .max(200, "Nama pengisi terlalu panjang."),
  jawatanPengisi: z
    .string()
    .trim()
    .min(1, "Sila isi jawatan pengisi.")
    .max(120, "Jawatan pengisi terlalu panjang."),
  items: z.array(itemSchema),
});

export type MaklumBalasItemData = {
  perkaraId: string;
  status: StatusMjkd;
  catatan: string;
  pautanBukti: string;
  fotoBukti: string[];
};

export type MaklumBalasData = {
  namaPengisi: string;
  jawatanPengisi: string;
  items: MaklumBalasItemData[];
};

export type SahkanResult =
  | { ok: true; data: MaklumBalasData }
  | { ok: false; error: string };

/** Pautan bukti mesti URL http(s) yang sah. */
export function isPautanHttp(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sahkan penghantaran maklum balas satu sekolah.
 * - Nama dan jawatan pengisi wajib.
 * - Setiap perkara yang terpakai (`terpakai`) mesti ada status yang sah; perkara luar
 *   senarai ditolak.
 * - Catatan wajib ikut 5W1H (min 30 aksara) kecuali status TIDAK_BERKAITAN.
 * - Bukti pilihan: pautan (mesti URL http(s)) dan/atau ≤ 3 gambar Drive.
 */
export function sahkanMaklumBalas(
  input: unknown,
  terpakai: readonly PerkaraRujukan[],
): SahkanResult {
  const shape = submissionShape.safeParse(input);
  if (!shape.success) {
    return { ok: false, error: shape.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const byId = new Map(terpakai.map((p) => [p.id, p]));
  const seen = new Set<string>();
  for (const it of shape.data.items) {
    if (!byId.has(it.perkaraId)) {
      return { ok: false, error: "Terdapat perkara yang tidak berkaitan dengan sekolah ini." };
    }
    if (seen.has(it.perkaraId)) {
      return { ok: false, error: "Terdapat perkara yang dihantar berganda." };
    }
    seen.add(it.perkaraId);
  }

  const items: MaklumBalasItemData[] = [];
  for (const p of terpakai) {
    const it = shape.data.items.find((x) => x.perkaraId === p.id);
    const rujuk = `Para ${p.para}`;
    if (!it || !isStatusMjkd(it.status)) {
      return { ok: false, error: `${rujuk}: sila pilih status.` };
    }
    const catatan = it.catatan.trim();
    if (it.status !== "TIDAK_BERKAITAN" && catatan.length < CATATAN_MIN) {
      return {
        ok: false,
        error: `${rujuk}: catatan (ikut 5W1H) sekurang-kurangnya ${CATATAN_MIN} aksara diperlukan.`,
      };
    }
    const pautanBukti = it.pautanBukti.trim();
    if (pautanBukti && !isPautanHttp(pautanBukti)) {
      return {
        ok: false,
        error: `${rujuk}: pautan bukti mesti bermula dengan http:// atau https://.`,
      };
    }
    const fotoBukti = [...new Set(it.fotoBukti ?? [])];
    if (fotoBukti.length > FOTO_BUKTI_MAKS) {
      return { ok: false, error: `${rujuk}: maksimum ${FOTO_BUKTI_MAKS} gambar bukti.` };
    }
    if (!fotoBukti.every(isPathFotoBukti)) {
      return { ok: false, error: `${rujuk}: gambar bukti tidak sah. Sila muat naik semula.` };
    }
    items.push({ perkaraId: p.id, status: it.status, catatan, pautanBukti, fotoBukti });
  }

  return {
    ok: true,
    data: {
      namaPengisi: shape.data.namaPengisi,
      jawatanPengisi: shape.data.jawatanPengisi,
      items,
    },
  };
}
