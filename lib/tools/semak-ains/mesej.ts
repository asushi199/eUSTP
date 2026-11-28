import type { RekodAins } from "./jenis";

export const SUMBER = "semak-ains";
export const ASAL_AINS = "https://ains.moe.gov.my";

/** Semua jenis mesej (ujian memastikan penanda.js menggunakan rentetan yang sama). */
export const JENIS_MESEJ = [
  "sedia",
  "sekolah",
  "mula",
  "rekod",
  "selesai-baca",
  "laksana",
  "kemajuan",
  "mengesahkan",
  "henti",
  "selesai-laksana",
] as const;
export type JenisMesej = (typeof JENIS_MESEJ)[number];

export type Tapisan = { tahun?: string; kelas?: string };

type S = { sumber: typeof SUMBER };

export type MesejDariAins =
  | (S & { jenis: "sekolah"; nama: string; kod: string | null; versiPenanda: number })
  | (S & { jenis: "rekod"; rekod: RekodAins[]; halaman: number; jumlahHalaman: number })
  | (S & { jenis: "selesai-baca"; bilangan: number; ralat: string | null; halamanGagal: number[] })
  | (S & { jenis: "kemajuan"; id: string; berjaya: boolean; jawapan: string | null })
  | (S & { jenis: "mengesahkan"; halaman: number; jumlahHalaman: number })
  | (S & {
      jenis: "selesai-laksana";
      berjaya: number;
      gagal: number;
      masihMenunggu: string[];
      dihentikan: boolean;
      ralat: string | null;
    });

export type MesejKeAins =
  | (S & { jenis: "sedia"; versiEnjin: string })
  | (S & { jenis: "mula"; tapisan: Tapisan })
  | (S & {
      jenis: "laksana";
      tindakan: "approved" | "rejected";
      item: { id: string; komen: string }[];
      jedaMs: number;
    })
  | (S & { jenis: "henti" });

export type TanpaSumber<T> = T extends unknown ? Omit<T, "sumber"> : never;

const DARI_AINS: string[] = ["sekolah", "rekod", "selesai-baca", "kemajuan", "mengesahkan", "selesai-laksana"];

/** Semak bentuk asas mesej daripada tab AINS (asal & sumber disemak oleh pemanggil). */
export function mesejAinsSah(data: unknown): data is MesejDariAins {
  if (!data || typeof data !== "object") return false;
  const d = data as { sumber?: unknown; jenis?: unknown };
  return d.sumber === SUMBER && typeof d.jenis === "string" && DARI_AINS.includes(d.jenis);
}
