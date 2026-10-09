import "server-only";

import {
  getAnalisisData,
  metricNum,
  metricText,
  delimaTrendPoints,
} from "./queries";
import { delimaTaburan } from "./delima-live";
import { getOptikHomeView, optikKpiGroupStats, optikKpiReferenceLines } from "./optik-queries";

/** Bentuk data boleh-serialize untuk kad + modal analisis di halaman utama. */
export type HomeBarChart = {
  title: string;
  seriesName: string;
  data: { label: string; jumlah: number }[];
};

export type HomeLineChart = {
  title: string;
  seriesName: string;
  data: { bulan: string; jumlah: number }[];
  referenceY?: number | null;
  referenceLabel?: string;
  referenceLines?: { y: number; label: string }[];
  percent?: boolean;
};

export type HomeDelimaTrend = {
  points: {
    bulan: string;
    guru: number | null;
    murid: number | null;
    murid23: number | null;
    guruGab: number | null;
    guru30: number | null;
    murid30: number | null;
  }[];
  kpiGuru: number | null;
  kpiMurid: number | null;
};

export type HomeKpiGroup = {
  wide?: boolean;
  title: string;
  stats: { label: string; value: string }[];
  align?: "left" | "center";
};

export type AnalisisHomeModule = {
  id:
    | "delima"
    | "dcs"
    | "ains"
    | "pensijilan"
    | "optik"
    | "bengkel"
    | "tebus-buku"
    | "penyertaan"
    | "khidmat-bantu"
    | "pinjaman-aset"
    | "tempahan-pkg";
  label: string;
  /** Nilai utama pada kad kecil halaman utama ("" jika belum ada data). */
  headlineValue: string;
  headlineLabel: string;
  /** Tahun data pada kad kecil, cth. "Data 2025". */
  yearLabel?: string;
  /** Nota kecil menonjol pada kad, cth. tahun semasa masih berlangsung. */
  callout?: string;
  tiles: { label: string; value: string }[];
  /** Kumpulan KPI ikut kategori (guru/murid, status/sasaran) — dipaparkan gantian `tiles` bila ada. */
  tileGroups?: HomeKpiGroup[];
  delimaTrend?: HomeDelimaTrend;
  /** DELIMa: data langsung tersedia → boleh terokai senarai sekolah dalam kad. */
  delimaLive?: boolean;
  bars: HomeBarChart[];
  line?: HomeLineChart;
  note?: string;
  /** Senarai bengkel paparan statik — butiran hanya dalam modal. */
  bengkel?: HomeBengkelProgram[];
  /** Baris angka dalam modal: nilai utama (cth. 404/705) dan anotasi (cth. 57.3%). */
  statRows?: HomeStatRow[];
};

export type HomeStatRow = {
  title: string;
  detail?: string;
  value: string;
  unit: string;
};

export type HomeBengkelProgram = {
  title: string;
  /** Nama rasmi program. Kekalkan ejaan CoE, jangan uppercase melalui CSS. */
  program: string;
  value: string;
  unit: string;
  /** Jumlah peruntukan, cth. "RM2,500.00". */
  peruntukan?: string;
};

/** Kumpulan "Capaian Sekolah": sekolah capai sasaran guru / murid (xx / jumlah). */
export function capaianStats(
  c: { guru: number | null; murid: number | null; jumlah: number | null } | null | undefined,
  bilSekolah: number | null,
): { label: string; value: string }[] {
  const jumlah = c?.jumlah ?? bilSekolah;
  const par = (n: number | null | undefined) =>
    n == null || jumlah == null ? "" : `${bil(n)} / ${bil(jumlah)}`;
  const stats = [
    { label: "Capaian Guru", value: par(c?.guru) },
    { label: "Capaian Murid", value: par(c?.murid) },
  ].filter((s) => s.value !== "");
  return stats.length > 0 ? stats : [{ label: "Bil. Sekolah", value: bil(bilSekolah) }];
}

function pct(n: number | null): string {
  return n == null ? "" : `${n.toLocaleString("ms-MY")}%`;
}
function bil(n: number | null): string {
  return n == null ? "" : n.toLocaleString("ms-MY");
}

/**
 * Ringkasan kelima-lima modul Analisis USTP untuk jalur "Analisis Semasa"
 * halaman utama. Pengiraan diselaraskan dengan /analisis — jika metrik
 * berubah di sana, kemas kini di sini juga.
 */
export async function getAnalisisHomeSummary(): Promise<AnalisisHomeModule[]> {
  const delima = await getAnalisisData("delima");
  const dcs = await getAnalisisData("dcs");
  const ains = await getAnalisisData("ains");
  const pensijilan = await getAnalisisData("pensijilan");
  const optik = await getAnalisisData("optik");
  const optikView = await getOptikHomeView(optik.metrics);

  /* ---------- DELIMa ---------- */
  const kpiGuru = metricNum(delima.metrics, "kpi_guru");
  const live = delima.live;
  const avgGuru = live ? live.guru.peratus : metricNum(delima.metrics, "avg_dis_guru");
  const avgMurid = live ? live.murid.peratus : metricNum(delima.metrics, "avg_dis_murid");
  const avgLabel = live ? "Guru Aktif (2.0 + 3.0)" : "Purata Guru Aktif (Dis)";
  const delimaModule: AnalisisHomeModule = {
    id: "delima",
    label: "DELIMa",
    headlineValue: pct(avgGuru),
    headlineLabel: avgLabel,
    tiles: [
      { label: "Bil. Sekolah", value: bil(metricNum(delima.metrics, "bil_sekolah", "schools")) },
      { label: avgLabel, value: pct(avgGuru) },
      { label: live ? "Murid Aktif (2.0 + 3.0)" : "Purata Murid Aktif (Dis)", value: pct(avgMurid) },
      { label: "Sasaran KPI Guru", value: pct(kpiGuru) },
      { label: "Sasaran KPI Murid", value: pct(metricNum(delima.metrics, "kpi_murid")) },
    ],
    tileGroups: [
      {
        title: "Capaian Sekolah",
        wide: true,
        stats: capaianStats(delima.capaiSekolah, metricNum(delima.metrics, "bil_sekolah", "schools")),
      },
      {
        title: "Guru",
        stats: [
          { label: live ? "Aktif · 2.0 + 3.0" : "Purata Aktif (Dis)", value: pct(avgGuru) },
          { label: "Sasaran KPI", value: pct(kpiGuru) },
        ],
      },
      {
        title: "Murid",
        stats: [
          { label: live ? "Aktif · 2.0 + 3.0" : "Purata Aktif (Dis)", value: pct(avgMurid) },
          { label: "Sasaran KPI", value: pct(metricNum(delima.metrics, "kpi_murid")) },
        ],
      },
      ...(live?.guruGabung
        ? [
            {
              title: `Jumlah Aktif Guru · DELIMa 2.0 + 3.0 · Sasaran ${live.guruGabung.sasaran ?? "—"}%`,
              stats: [
                {
                  label: live.guruGabung.capai ? "Capai" : "Belum capai",
                  value: pct(live.guruGabung.peratus),
                },
                {
                  label: `aktif daripada ${bil(live.guruGabung.jumlah)}`,
                  value: bil(live.guruGabung.aktif),
                },
              ],
            },
          ]
        : []),
      ...(live?.kadMurid
        ? [
            {
              title: `Jumlah Aktif Murid · DELIMa 2.0 + 3.0 · Sasaran ${live.kadMurid.sasaran ?? "—"}%`,
              stats: [
                {
                  label: live.kadMurid.capai ? "Capai" : "Belum capai",
                  value: pct(live.kadMurid.peratus),
                },
                {
                  label: `aktif daripada ${bil(live.kadMurid.jumlah)}`,
                  value: bil(live.kadMurid.aktif),
                },
              ],
            },
          ]
        : []),
    ],
    delimaTrend: {
      points: delimaTrendPoints(delima),
      kpiGuru,
      kpiMurid: metricNum(delima.metrics, "kpi_murid"),
    },
    delimaLive: live != null,
    bars: delimaTaburan(delima.liveSchools),
    note: live
      ? `Data langsung DELIMa Perak (${live.tempoh}). DELIMa 2.0 dan 3.0${live.v30 ? " (pengguna aktif setiap platform, CSV KPM)" : ""} dikira berasingan; "Jumlah Aktif ... 2.0 + 3.0" ialah pernah log masuk salah satu platform dan itulah yang dibandingkan dengan sasaran KPI.`
      : undefined,
  };

  /* ---------- DCS ---------- */
  const dcsCapai = metricNum(dcs.metrics, "capai");
  const dcsModule: AnalisisHomeModule = {
    id: "dcs",
    label: "DCS",
    headlineValue: pct(dcsCapai),
    headlineLabel: "Pencapaian DCS",
    yearLabel: "Data 2025",
    callout: "2026 masih berlangsung",
    tiles: [],
    bars: [
      {
        title: "TOV · KPI · Pencapaian 2025 (%)",
        seriesName: "%",
        data: [
          { label: "TOV", jumlah: metricNum(dcs.metrics, "tov") ?? 0 },
          { label: "KPI", jumlah: metricNum(dcs.metrics, "kpi") ?? 0 },
          { label: "Capai", jumlah: dcsCapai ?? 0 },
        ].filter((b) => b.jumlah > 0),
      },
    ],
    note: metricText(dcs.metrics, "updated_text", "kemaskini"),
  };

  /* ---------- AINS ---------- */
  const ainsApproved = metricNum(ains.metrics, "approved");
  const ainsModule: AnalisisHomeModule = {
    id: "ains",
    label: "Program Ains",
    headlineValue: bil(ainsApproved),
    headlineLabel: "Buku Diluluskan",
    tiles: [
      { label: "Buku Diluluskan", value: bil(ainsApproved) },
      { label: "Ditolak", value: bil(metricNum(ains.metrics, "rejected")) },
    ],
    bars: [
      {
        title: "Buku Diluluskan Ikut Jenis Sekolah",
        seriesName: "Buku",
        data: [
          { label: "SK", jumlah: metricNum(ains.metrics, "sk_approved", "sk") ?? 0 },
          { label: "SJKC", jumlah: metricNum(ains.metrics, "sjkc_approved", "sjkc") ?? 0 },
          { label: "SJKT", jumlah: metricNum(ains.metrics, "sjkt_approved", "sjkt") ?? 0 },
        ].filter((b) => b.jumlah > 0),
      },
    ],
  };

  /* ---------- Pensijilan ---------- */
  const pensijilanLokasi = pensijilan.breakdown
    .filter((b) => b.kind === "lokasi")
    .map((b) => ({ label: b.label, jumlah: b.value }));
  const pensijilanSekolah = pensijilan.breakdown
    .filter((b) => b.kind === "sekolah")
    .map((b) => ({ label: b.label, jumlah: b.value }));
  const totalSijil = pensijilanLokasi.reduce((sum, b) => sum + b.jumlah, 0);
  const pensijilanModule: AnalisisHomeModule = {
    id: "pensijilan",
    label: "Pensijilan Digital",
    headlineValue: totalSijil > 0 ? bil(totalSijil) : "",
    headlineLabel: "Jumlah Sijil",
    tiles: [],
    bars: [
      { title: "Ikut Lokasi", seriesName: "Sijil", data: pensijilanLokasi },
      { title: "Ikut Jenis Sekolah", seriesName: "Sijil", data: pensijilanSekolah },
    ],
    note: metricText(pensijilan.metrics, "intro"),
  };

  /* ---------- OPTIK ---------- */
  const optikSelesai = optikView.current?.selesaiPct ?? metricNum(optik.metrics, "selesai_pct");
  const optikSelesaiBil = optikView.current?.selesaiBil ?? metricNum(optik.metrics, "selesai_bil");
  const optikBelumPct = optikView.current?.belumPct ?? metricNum(optik.metrics, "belum_pct");
  const optikBelumBil = optikView.current?.belumBil ?? null;
  const optikKpiStats = optikKpiGroupStats(optik.metrics);
  const optikKpiLines = optikKpiReferenceLines(optik.metrics);
  const optikModule: AnalisisHomeModule = {
    id: "optik",
    label: "AI Tools (OPTIK)",
    headlineValue: pct(optikSelesai),
    headlineLabel: "Selesai",
    tiles: [
      { label: "Selesai", value: pct(optikSelesai) },
      { label: "Bil. Selesai", value: bil(optikSelesaiBil) },
      { label: "Belum Selesai", value: pct(optikBelumPct) },
      ...optikKpiStats.map((row) => ({ label: `KPI ${row.label}`, value: row.value })),
    ],
    tileGroups: [
      {
        title: "KPI Kebangsaan",
        align: "center" as const,
        stats: optikKpiStats.length > 0 ? optikKpiStats : [{ label: "Sasaran", value: "" }],
      },
      {
        title: "Selesai",
        stats: [
          { label: "Peratus", value: pct(optikSelesai) },
          { label: "Bil. Selesai", value: bil(optikSelesaiBil) },
        ],
      },
      {
        title: "Belum Selesai",
        stats: [
          { label: "Peratus", value: pct(optikBelumPct) },
          { label: "Bil. Belum Selesai", value: bil(optikBelumBil) },
        ],
      },
    ],
    bars: [],
    line: {
      title: "Perkembangan Penggunaan AI Tools (%)",
      seriesName: "%",
      data: optikView.trend,
      percent: true,
      referenceY: optikKpiLines[optikKpiLines.length - 1]?.y ?? null,
      referenceLabel: optikKpiLines[optikKpiLines.length - 1]?.label,
      referenceLines: optikKpiLines,
    },
  };

  return [delimaModule, dcsModule, ainsModule, pensijilanModule, optikModule];
}
