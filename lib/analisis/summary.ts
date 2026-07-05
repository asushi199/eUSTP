import "server-only";

import { getAnalisisData, metricNum, metricText } from "./queries";

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
};

export type HomeDelimaTrend = {
  points: { bulan: string; guru: number | null; murid: number | null }[];
  kpiGuru: number | null;
};

export type AnalisisHomeModule = {
  id: "delima" | "dcs" | "ains" | "pensijilan" | "optik";
  label: string;
  /** Nilai utama pada kad kecil halaman utama ("" jika belum ada data). */
  headlineValue: string;
  headlineLabel: string;
  tiles: { label: string; value: string }[];
  delimaTrend?: HomeDelimaTrend;
  bars: HomeBarChart[];
  line?: HomeLineChart;
  note?: string;
};

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
  const [delima, dcs, ains, pensijilan, optik] = await Promise.all([
    getAnalisisData("delima"),
    getAnalisisData("dcs"),
    getAnalisisData("ains"),
    getAnalisisData("pensijilan"),
    getAnalisisData("optik"),
  ]);

  /* ---------- DELIMa ---------- */
  const kpiGuru = metricNum(delima.metrics, "kpi_guru");
  const avgGuru = metricNum(delima.metrics, "avg_dis_guru");
  const delimaModule: AnalisisHomeModule = {
    id: "delima",
    label: "DELIMa",
    headlineValue: pct(avgGuru),
    headlineLabel: "Purata Guru Aktif (Dis)",
    tiles: [
      { label: "Bil. Sekolah", value: bil(metricNum(delima.metrics, "bil_sekolah", "schools")) },
      { label: "Khidmat Bantu (kali)", value: bil(metricNum(delima.metrics, "khidmat_bantu_kali")) },
      {
        label: "Khidmat Bantu (sekolah)",
        value: bil(metricNum(delima.metrics, "khidmat_bantu_sekolah")),
      },
      { label: "Purata Guru Aktif (Dis)", value: pct(avgGuru) },
      { label: "Purata Murid Aktif (Dis)", value: pct(metricNum(delima.metrics, "avg_dis_murid")) },
      { label: "Sasaran KPI Guru", value: pct(kpiGuru) },
      { label: "Sasaran KPI Murid", value: pct(metricNum(delima.metrics, "kpi_murid")) },
    ],
    delimaTrend: {
      points: delima.monthly
        .filter((r) => r.includeChart)
        .map((r) => ({ bulan: r.chartLabel || r.monthLabel, guru: r.guruPct, murid: r.muridPct })),
      kpiGuru,
    },
    bars: [],
  };

  /* ---------- DCS ---------- */
  const dcsCapai = metricNum(dcs.metrics, "capai");
  const dcsModule: AnalisisHomeModule = {
    id: "dcs",
    label: "DCS",
    headlineValue: pct(dcsCapai),
    headlineLabel: "Pencapaian DCS",
    tiles: [],
    bars: [
      {
        title: "TOV · KPI · Pencapaian (%)",
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
  const optikSelesai = metricNum(optik.metrics, "selesai_pct");
  const optikModule: AnalisisHomeModule = {
    id: "optik",
    label: "AI Tools (OPTIK)",
    headlineValue: pct(optikSelesai),
    headlineLabel: "Selesai",
    tiles: [
      { label: "Selesai", value: pct(optikSelesai) },
      { label: "Bil. Selesai", value: bil(metricNum(optik.metrics, "selesai_bil")) },
      { label: "Belum Selesai", value: pct(metricNum(optik.metrics, "belum_pct")) },
      { label: "KPI Kebangsaan", value: pct(metricNum(optik.metrics, "kpi_kebangsaan")) },
    ],
    bars: [],
    line: {
      title: "Perkembangan Penggunaan AI Tools (%)",
      seriesName: "%",
      data: [
        { bulan: "TOV 2024", jumlah: metricNum(optik.metrics, "tov2024", "tov_2024") ?? 0 },
        { bulan: "AR1 (Jul)", jumlah: metricNum(optik.metrics, "ar1_julai", "ar1") ?? 0 },
        { bulan: "AR2 (Okt)", jumlah: metricNum(optik.metrics, "ar2_okt", "ar2") ?? 0 },
        { bulan: "Selesai", jumlah: optikSelesai ?? 0 },
      ].filter((p) => p.jumlah > 0),
    },
  };

  return [delimaModule, dcsModule, ainsModule, pensijilanModule, optikModule];
}
