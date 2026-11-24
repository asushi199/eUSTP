/**
 * Paparan Pensijilan Digital — dikongsi /analisis dan modal CoE Analytics halaman utama.
 * Data dalam `analisis_breakdown` (modul `pensijilan`): kind `lokasi`, `sekolah`, dan
 * satu kind per platform (`google`, `apple`, `microsoft`). Sumber: scripts/data/analisis-pensijilan.csv
 * → `npm run db:import-pensijilan`.
 */
import type { KpiGroup } from "@/components/analisis/KpiGroups";

type Row = { kind: string; label: string; value: number };
type Point = { label: string; jumlah: number };

/** Platform ikut susunan paparan; `nama` = label penuh setiap kod pensijilan. */
export const PENSIJILAN_PLATFORM: { kind: string; title: string; nama: Record<string, string> }[] = [
  {
    kind: "google",
    title: "Google for Education",
    nama: {
      GCE1: "Certified Educator Tahap 1",
      GCE2: "Certified Educator Tahap 2",
      GCT: "Certified Trainer",
    },
  },
  { kind: "apple", title: "Apple Education Community", nama: {} },
  {
    kind: "microsoft",
    title: "Microsoft Education",
    nama: { MIE: "Innovative Educator", MIEE: "Innovative Educator Expert" },
  },
];

function bil(n: number): string {
  return n.toLocaleString("ms-MY");
}

export type PensijilanView = {
  lokasi: Point[];
  sekolah: Point[];
  /** Jumlah pensijilan semua platform (0 jika tiada data platform). */
  jumlahPlatform: number;
  /** Ringkasan + satu kumpulan per platform (untuk KpiGroups). */
  groups: KpiGroup[];
};

export function pensijilanView(breakdown: Row[]): PensijilanView {
  const pick = (kind: string): Point[] =>
    breakdown.filter((b) => b.kind === kind).map((b) => ({ label: b.label, jumlah: b.value }));

  const platform = PENSIJILAN_PLATFORM.map((p) => {
    const rows = pick(p.kind);
    return { ...p, rows, jumlah: rows.reduce((a, r) => a + r.jumlah, 0) };
  }).filter((p) => p.rows.length > 0);
  const jumlahPlatform = platform.reduce((a, p) => a + p.jumlah, 0);

  const groups: KpiGroup[] = [];
  if (platform.length > 0) {
    groups.push({
      title: "Ringkasan Pensijilan",
      wide: true,
      align: "center",
      stats: [
        { label: "Jumlah Pensijilan", value: bil(jumlahPlatform) },
        ...platform.map((p) => ({ label: p.title, value: bil(p.jumlah) })),
      ],
    });
    for (const p of platform) {
      groups.push({
        title: p.title,
        // Google (4 pensijilan) satu baris penuh; Apple & Microsoft berkongsi baris.
        wide: p.rows.length >= 3,
        align: "center",
        stats: p.rows.map((r) => ({
          label: p.nama[r.label] ? `${r.label} · ${p.nama[r.label]}` : r.label,
          value: bil(r.jumlah),
        })),
      });
    }
  }

  return { lokasi: pick("lokasi"), sekolah: pick("sekolah"), jumlahPlatform, groups };
}
