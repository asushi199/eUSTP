import { z } from "zod";
import { isStatusMjkd, type StatusMjkd } from "./enums";

export const CATATAN_MIN = 10;
export const CATATAN_MAX = 2000;
export const PAUTAN_MAX = 500;

export type PerkaraRujukan = { id: string; para: string };

const itemSchema = z.object({
  perkaraId: z.string().min(1),
  status: z.string(),
  catatan: z.string().max(CATATAN_MAX, "Catatan terlalu panjang."),
  pautanBukti: z.string().max(PAUTAN_MAX, "Pautan bukti terlalu panjang."),
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
 * - Catatan wajib (min 10 aksara) kecuali status TIDAK_BERKAITAN.
 * - Pautan bukti pilihan, tetapi mesti URL http(s).
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
        error: `${rujuk}: catatan sekurang-kurangnya ${CATATAN_MIN} aksara diperlukan.`,
      };
    }
    const pautanBukti = it.pautanBukti.trim();
    if (pautanBukti && !isPautanHttp(pautanBukti)) {
      return {
        ok: false,
        error: `${rujuk}: pautan bukti mesti bermula dengan http:// atau https://.`,
      };
    }
    items.push({ perkaraId: p.id, status: it.status, catatan, pautanBukti });
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
