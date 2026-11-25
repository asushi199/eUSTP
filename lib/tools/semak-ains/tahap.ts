import type { Jalur } from "./jenis";

export type Tahap = { kod: string; jalur: Jalur };

/** Hurai kelas AINS → kod tahap (D1–D6, T1–T5, P) dan jalur ambang. */
export function huraiKelas(kelas: string): Tahap {
  const k = kelas.toUpperCase();
  const t = k.match(/TINGKATAN\s*(\d)/);
  if (t) return { kod: `T${t[1] ?? ""}`, jalur: "M" };
  if (/PERALIHAN/.test(k)) return { kod: "P", jalur: "M" };
  const d = k.match(/TAHUN\s*(\d)/);
  if (d) {
    const n = Number(d[1]);
    return { kod: `D${n}`, jalur: n <= 2 ? "D1-2" : n <= 4 ? "D3-4" : "D5-6" };
  }
  return { kod: "?", jalur: "D5-6" };
}
