import type { OptikSnapshotSummary } from "@/lib/analisis/optik-types";

const fmtPct = (n: number) => `${n.toLocaleString("ms-MY", { maximumFractionDigits: 2 })}%`;
const fmtBil = (n: number) => n.toLocaleString("ms-MY");

/** Kad KPI tambahan AI Tools: guru belum log masuk + murid. Kosong jika snapshot tiada data berkenaan. */
export function optikTambahanGroups(
  current: OptikSnapshotSummary | null,
): { title: string; wide: true; stats: { label: string; value: string }[] }[] {
  if (!current) return [];
  const groups: { title: string; wide: true; stats: { label: string; value: string }[] }[] = [];
  if (current.guruBelumLogin > 0) {
    groups.push({
      title: "Guru Belum Log Masuk DELIMa",
      wide: true,
      stats: [
        { label: "Bilangan", value: fmtBil(current.guruBelumLogin) },
        {
          label: "Daripada jumlah guru",
          value: fmtPct((100 * current.guruBelumLogin) / Math.max(1, current.totalBil)),
        },
      ],
    });
  }
  if (current.muridJumlah > 0) {
    groups.push({
      title: "Murid Guna AI Tools",
      wide: true,
      stats: [
        { label: "Peratus", value: fmtPct(current.muridPct) },
        { label: "Bil. Guna", value: fmtBil(current.muridAi) },
        { label: "Jumlah Murid", value: fmtBil(current.muridJumlah) },
      ],
    });
  }
  return groups;
}
