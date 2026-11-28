import type { Jalur, KodSebab, Ukuran } from "./jenis";

export type Ambang = { merah: number; kuning: number };
export type ModPeraturan = "merah" | "kuning" | "abai";

export type Standard = {
  /** Jumlah panjang Rumusan + Pengajaran: < merah = R2; < kuning = Y1. Tiada had atas (Y2 dimansuhkan, enjin 1.1.0). */
  ambang: Record<Ukuran, Record<Jalur, Ambang>>;
  /** Minimum setiap ruangan (R1). */
  minRuangan: Record<Ukuran, number>;
  hantarSemulaSama: ModPeraturan;
  bukuSamaBerulang: ModPeraturan;
  /** Bahasa Rumusan dan Pengajaran berbeza (R8/Y8); lalai mati. */
  bahasaBercampur: ModPeraturan;
  aktivitiKelas: "benar" | "kuning";
  bahasaTakSepadan: boolean;
  semakUnsurPengajaran: boolean;
  ambangMuridLuarBiasa: number;
  jedaMs: number;
  /** Ganti komen lalai kepada murid (kosong = guna KOMEN_LALAI). */
  komen: Partial<Record<KodSebab, string>>;
};

/**
 * Standard lalai daerah (spesifikasi §7.1), dikalibrasi pada 6 sekolah 2026-11-25.
 * Mengubah nilai di sini = naikkan VERSI_ENJIN dalam versi.ts.
 */
export const STANDARD_DAERAH: Standard = {
  ambang: {
    kata: {
      "D1-2": { merah: 6, kuning: 12 },
      "D3-4": { merah: 10, kuning: 20 },
      "D5-6": { merah: 10, kuning: 20 },
      M: { merah: 15, kuning: 25 },
    },
    zh: {
      "D1-2": { merah: 40, kuning: 60 },
      "D3-4": { merah: 60, kuning: 100 },
      "D5-6": { merah: 80, kuning: 120 },
      M: { merah: 60, kuning: 150 },
    },
  },
  minRuangan: { kata: 3, zh: 5 },
  hantarSemulaSama: "merah",
  bukuSamaBerulang: "kuning",
  bahasaBercampur: "abai",
  aktivitiKelas: "benar",
  bahasaTakSepadan: true,
  semakUnsurPengajaran: false,
  ambangMuridLuarBiasa: 50,
  jedaMs: 500,
  komen: {},
};

/** Tetapan GPM: subset separa Standard (disimpan dalam localStorage). */
export type TetapanGpm = {
  ambang?: Partial<Record<Ukuran, Partial<Record<Jalur, Partial<Ambang>>>>>;
  minRuangan?: Partial<Record<Ukuran, number>>;
  hantarSemulaSama?: ModPeraturan;
  bukuSamaBerulang?: ModPeraturan;
  bahasaBercampur?: ModPeraturan;
  aktivitiKelas?: "benar" | "kuning";
  bahasaTakSepadan?: boolean;
  semakUnsurPengajaran?: boolean;
  ambangMuridLuarBiasa?: number;
  jedaMs?: number;
  komen?: Partial<Record<KodSebab, string>>;
};

const UKURAN: Ukuran[] = ["kata", "zh"];
const JALUR: Jalur[] = ["D1-2", "D3-4", "D5-6", "M"];
const MOD: ModPeraturan[] = ["merah", "kuning", "abai"];

function nomborSah(v: unknown, lalai: number, min: number, maks: number): number {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.min(maks, Math.max(min, Math.round(v)))
    : lalai;
}

/** Gabung tetapan GPM (boleh separa / tidak sah) dengan standard daerah. */
export function gabungStandard(
  t: TetapanGpm | null | undefined,
  asas: Standard = STANDARD_DAERAH,
): Standard {
  const s: Standard = structuredClone(asas);
  if (!t || typeof t !== "object") return s;
  for (const u of UKURAN) {
    for (const j of JALUR) {
      const a = t.ambang?.[u]?.[j];
      if (!a) continue;
      const cur = s.ambang[u][j];
      cur.merah = nomborSah(a.merah, cur.merah, 0, 5000);
      cur.kuning = Math.max(cur.merah, nomborSah(a.kuning, cur.kuning, 0, 5000));
    }
    s.minRuangan[u] = nomborSah(t.minRuangan?.[u], s.minRuangan[u], 0, 100);
  }
  if (t.hantarSemulaSama && MOD.includes(t.hantarSemulaSama)) s.hantarSemulaSama = t.hantarSemulaSama;
  if (t.bukuSamaBerulang && MOD.includes(t.bukuSamaBerulang)) s.bukuSamaBerulang = t.bukuSamaBerulang;
  if (t.bahasaBercampur && MOD.includes(t.bahasaBercampur)) s.bahasaBercampur = t.bahasaBercampur;
  if (t.aktivitiKelas === "benar" || t.aktivitiKelas === "kuning") s.aktivitiKelas = t.aktivitiKelas;
  if (typeof t.bahasaTakSepadan === "boolean") s.bahasaTakSepadan = t.bahasaTakSepadan;
  if (typeof t.semakUnsurPengajaran === "boolean") s.semakUnsurPengajaran = t.semakUnsurPengajaran;
  s.ambangMuridLuarBiasa = nomborSah(t.ambangMuridLuarBiasa, s.ambangMuridLuarBiasa, 1, 100000);
  s.jedaMs = nomborSah(t.jedaMs, s.jedaMs, 300, 2000);
  if (t.komen && typeof t.komen === "object") {
    for (const [k, v] of Object.entries(t.komen)) {
      if (typeof v === "string" && v.trim()) s.komen[k as KodSebab] = v.trim().slice(0, 500);
    }
  }
  return s;
}

/** Tetapan bersarang minimum (hanya medan yang berbeza daripada asas) — untuk disimpan. */
export function tetapanBeza(s: Standard, asas: Standard = STANDARD_DAERAH): TetapanGpm {
  const beza = (a: unknown, b: unknown): unknown => {
    if (a !== null && typeof a === "object") {
      const ao = a as Record<string, unknown>;
      const bo = (b ?? {}) as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(ao)) {
        const v = beza(ao[k], bo[k]);
        if (v !== undefined) out[k] = v;
      }
      return Object.keys(out).length ? out : undefined;
    }
    return a === b ? undefined : a;
  };
  return (beza(s, asas) as TetapanGpm | undefined) ?? {};
}

/** Perbezaan dirata untuk log pemantauan, cth. { "ambang.kata.D5-6.merah": 8 }. Komen dikecualikan. */
export function bezaStandard(
  s: Standard,
  asas: Standard = STANDARD_DAERAH,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  const jalan = (a: unknown, b: unknown, laluan: string): void => {
    if (laluan === "komen") return;
    if (a !== null && typeof a === "object") {
      const ao = a as Record<string, unknown>;
      const bo = (b ?? {}) as Record<string, unknown>;
      for (const k of Object.keys(ao)) jalan(ao[k], bo[k], laluan ? `${laluan}.${k}` : k);
      return;
    }
    if (a !== b && (typeof a === "string" || typeof a === "number" || typeof a === "boolean")) {
      out[laluan] = a;
    }
  };
  jalan(s, asas, "");
  return out;
}
