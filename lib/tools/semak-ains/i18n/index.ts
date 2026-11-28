import { ms, type Kamus } from "./ms";
import { ta } from "./ta";
import { zh } from "./zh";

export type { Kamus };

/** Bahasa paparan alat (bukan bahasa rekod murid). Pengecualian sah kepada "UI 100% BM" — lihat CLAUDE.md. */
export type BahasaUi = "ms" | "zh" | "ta";

export const BAHASA_UI: { kod: BahasaUi; label: string; lang: string }[] = [
  { kod: "ms", label: "Bahasa Melayu", lang: "ms" },
  { kod: "zh", label: "中文", lang: "zh-Hans" },
  { kod: "ta", label: "தமிழ்", lang: "ta" },
];

export const KAMUS: Record<BahasaUi, Kamus> = { ms, zh, ta };

export function bahasaSah(v: unknown): v is BahasaUi {
  return v === "ms" || v === "zh" || v === "ta";
}

const KUNCI = "semak-ains:bahasa";

/**
 * Bahasa semasa: pilihan tersimpan dalam pelayar ini → `?bahasa=` (dibawa oleh penanda mengikut
 * bahasa semasa ia dipasang) → BM. Dalam mod tetingkap, storan NEXa dipartisi di bawah AINS, jadi
 * pilihan pada halaman pasang TIDAK kelihatan di sini — sebab itulah penanda membawa `?bahasa=`.
 */
export function bacaBahasaUi(): BahasaUi {
  try {
    const simpan = window.localStorage.getItem(KUNCI);
    if (bahasaSah(simpan)) return simpan;
  } catch {
    /* storan disekat — guna URL / lalai */
  }
  try {
    const url = new URLSearchParams(window.location.search).get("bahasa");
    if (bahasaSah(url)) return url;
  } catch {
    /* abaikan */
  }
  return "ms";
}

export function simpanBahasaUi(b: BahasaUi): void {
  try {
    window.localStorage.setItem(KUNCI, b);
  } catch {
    /* storan disekat — pilihan kekal untuk paparan ini sahaja */
  }
}

const R = ms.ralatPenanda;
const TETAP = ["sibuk", "dihentikan", "tigaGagal", "takDapatSahkan", "ditutupLaksana", "ditutupBaca", "tiadaId"] as const;

/**
 * Mesej ralat yang dijana oleh penanda.js sentiasa tiba dalam BM (penanda lama pun begitu).
 * Terjemah bahagian yang dikenali; teks yang tidak dikenali (cth. jawapan mentah AINS) dikekalkan.
 */
export function terjemahRalatPenanda(teks: string, k: Kamus): string {
  if (!teks || k === ms) return teks;
  let t = teks;
  for (const kunci of TETAP) t = t.split(R[kunci]).join(k.ralatPenanda[kunci]);
  t = t.replace(
    /Bilangan rekod menunggu dalam AINS hanya turun (\d+) \(dijangka (\d+)\)\. Tekan Baca semula untuk memastikan\./g,
    (_p, turun: string, dijangka: string) => k.ralatPenanda.hanyaTurun(turun, dijangka),
  );
  t = t.replace(/Gagal membaca halaman (\d+)\./g, (_p, h: string) => k.ralatPenanda.gagalHalaman(h));
  t = t.replace(/^Ralat tidak dijangka: ([\s\S]*)$/, (_p, butiran: string) => k.ralatPenanda.takDijangka(butiran));
  return t;
}
