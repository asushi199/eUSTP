import type { Keputusan, KodSebab, RekodAins } from "./jenis";
import { LABEL_SEBAB } from "./komen";

export type BarisCsv = {
  rekod: RekodAins;
  keputusan: Keputusan;
  tindakan: string;
  hasil: string;
  masa: string;
};

function sel(v: string): string {
  let s = v.replace(/[\r\n]+/g, " ");
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV UTF-8 dengan BOM (untuk Excel) — disimpan pada komputer GPM sahaja. */
export function janaCsv(
  baris: BarisCsv[],
  versi: string,
  /** Label sebab mengikut bahasa paparan (lalai BM). Kepala lajur kekal BM. */
  labelSebab: Record<KodSebab, string> = LABEL_SEBAB,
): string {
  const kepala = ["id", "murid", "kelas", "tajuk", "warna", "sebab", "tindakan", "hasil", "masa", "versi_standard"];
  const isi = baris.map((b) =>
    [
      b.rekod.id,
      b.rekod.murid,
      b.rekod.kelas,
      b.rekod.tajuk,
      b.keputusan.warna,
      [...b.keputusan.merah, ...b.keputusan.kuning].map((k) => labelSebab[k]).join(" | "),
      b.tindakan,
      b.hasil,
      b.masa,
      versi,
    ]
      .map(sel)
      .join(","),
  );
  return `\uFEFF${[kepala.join(","), ...isi].join("\r\n")}`;
}
