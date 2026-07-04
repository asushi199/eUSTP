import type { Metadata } from "next";
import { getAnalisisData, metricNum, metricText } from "@/lib/analisis/queries";
import AnalisisKpiTiles from "@/components/analisis/AnalisisKpiTiles";
import DelimaTrendChart from "@/components/analisis/DelimaTrendChart";
import MonthlyLineChart from "@/components/stats/MonthlyLineChart";
import BreakdownBarChart from "@/components/stats/BreakdownBarChart";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Analisis USTP — eUSTP Manjung",
  description:
    "Analisis DELIMa, DCS, Program Ains, Pensijilan Digital dan AI Tools (OPTIK) daerah Manjung.",
};

const SECTIONS = [
  { id: "delima", label: "DELIMa" },
  { id: "dcs", label: "DCS" },
  { id: "ains", label: "Program Ains" },
  { id: "pensijilan", label: "Pensijilan Digital" },
  { id: "optik", label: "AI Tools (OPTIK)" },
];

function pct(n: number | null): string {
  return n == null ? "" : `${n.toLocaleString("ms-MY")}%`;
}
function bil(n: number | null): string {
  return n == null ? "" : n.toLocaleString("ms-MY");
}

function SourceLink({ url, label }: { url: string; label: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-blue mt-3 inline-block text-sm"
    >
      {label || "Buka sumber data"}
    </a>
  );
}

export default async function AnalisisPage() {
  const [delima, dcs, ains, pensijilan, optik] = await Promise.all([
    getAnalisisData("delima"),
    getAnalisisData("dcs"),
    getAnalisisData("ains"),
    getAnalisisData("pensijilan"),
    getAnalisisData("optik"),
  ]);

  /* ---------- DELIMa ---------- */
  const kpiGuru = metricNum(delima.metrics, "kpi_guru");
  const delimaPoints = delima.monthly
    .filter((r) => r.includeChart)
    .map((r) => ({ bulan: r.chartLabel || r.monthLabel, guru: r.guruPct, murid: r.muridPct }));
  const delimaTiles = [
    { label: "Bil. Sekolah", value: bil(metricNum(delima.metrics, "bil_sekolah", "schools")) },
    {
      label: "Khidmat Bantu (kali)",
      value: bil(metricNum(delima.metrics, "khidmat_bantu_kali")),
    },
    {
      label: "Khidmat Bantu (sekolah)",
      value: bil(metricNum(delima.metrics, "khidmat_bantu_sekolah")),
    },
    { label: "Purata Guru Aktif (Dis)", value: pct(metricNum(delima.metrics, "avg_dis_guru")) },
    { label: "Purata Murid Aktif (Dis)", value: pct(metricNum(delima.metrics, "avg_dis_murid")) },
    { label: "Sasaran KPI Guru", value: pct(kpiGuru) },
    { label: "Sasaran KPI Murid", value: pct(metricNum(delima.metrics, "kpi_murid")) },
  ];

  /* ---------- DCS ---------- */
  const dcsBars = [
    { label: "TOV", jumlah: metricNum(dcs.metrics, "tov") ?? 0 },
    { label: "KPI", jumlah: metricNum(dcs.metrics, "kpi") ?? 0 },
    { label: "Capai", jumlah: metricNum(dcs.metrics, "capai") ?? 0 },
  ].filter((b) => b.jumlah > 0);

  /* ---------- AINS ---------- */
  const ainsTiles = [
    { label: "Buku Diluluskan", value: bil(metricNum(ains.metrics, "approved")) },
    { label: "Ditolak", value: bil(metricNum(ains.metrics, "rejected")) },
  ];
  const ainsBars = [
    { label: "SK", jumlah: metricNum(ains.metrics, "sk_approved", "sk") ?? 0 },
    { label: "SJKC", jumlah: metricNum(ains.metrics, "sjkc_approved", "sjkc") ?? 0 },
    { label: "SJKT", jumlah: metricNum(ains.metrics, "sjkt_approved", "sjkt") ?? 0 },
  ].filter((b) => b.jumlah > 0);

  /* ---------- Pensijilan ---------- */
  const pensijilanLokasi = pensijilan.breakdown
    .filter((b) => b.kind === "lokasi")
    .map((b) => ({ label: b.label, jumlah: b.value }));
  const pensijilanSekolah = pensijilan.breakdown
    .filter((b) => b.kind === "sekolah")
    .map((b) => ({ label: b.label, jumlah: b.value }));

  /* ---------- OPTIK ---------- */
  const optikSeries = [
    { bulan: "TOV 2024", jumlah: metricNum(optik.metrics, "tov2024", "tov_2024") ?? 0 },
    { bulan: "AR1 (Jul)", jumlah: metricNum(optik.metrics, "ar1_julai", "ar1") ?? 0 },
    { bulan: "AR2 (Okt)", jumlah: metricNum(optik.metrics, "ar2_okt", "ar2") ?? 0 },
    { bulan: "Selesai", jumlah: metricNum(optik.metrics, "selesai_pct") ?? 0 },
  ].filter((p) => p.jumlah > 0);
  const optikTiles = [
    { label: "Selesai", value: pct(metricNum(optik.metrics, "selesai_pct")) },
    { label: "Bil. Selesai", value: bil(metricNum(optik.metrics, "selesai_bil")) },
    { label: "Belum Selesai", value: pct(metricNum(optik.metrics, "belum_pct")) },
    { label: "KPI Kebangsaan", value: pct(metricNum(optik.metrics, "kpi_kebangsaan")) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <header>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Analisis USTP</h1>
        <p className="mt-2 max-w-xl leading-relaxed text-graphite">
          Analisis data teknologi pendidikan daerah Manjung — dikemas kini oleh
          pentadbir USTP.
        </p>
      </header>

      {/* Sub-navigasi sauh */}
      <nav
        className="hairline sticky top-16 z-10 -mx-4 mt-6 overflow-x-auto border-b bg-white px-4 py-2 sm:-mx-8 sm:px-8"
        aria-label="Bahagian analisis"
      >
        <ul className="flex gap-4 whitespace-nowrap text-sm">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-graphite hover:text-ink hover:underline">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---------- DELIMa ---------- */}
      <section id="delima" className="mt-10 scroll-mt-28">
        <h2 className="text-xl font-semibold">DELIMa</h2>
        {metricText(delima.metrics, "intro") ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-graphite">
            {metricText(delima.metrics, "intro")}
          </p>
        ) : null}
        <div className="mt-4">
          <AnalisisKpiTiles tiles={delimaTiles} />
        </div>
        <div className="mt-4">
          <DelimaTrendChart data={delimaPoints} kpiGuru={kpiGuru} />
        </div>
        <SourceLink url={metricText(delima.metrics, "source_url")} label="Buka sumber DELIMa" />
      </section>

      {/* ---------- DCS ---------- */}
      <section id="dcs" className="mt-12 scroll-mt-28">
        <h2 className="text-xl font-semibold">Digital Competency Score (DCS)</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BreakdownBarChart title="TOV · KPI · Pencapaian (%)" data={dcsBars} seriesName="%" />
          <div className="card p-5 text-sm leading-relaxed text-graphite">
            {metricText(dcs.metrics, "updated_text", "kemaskini") ? (
              <p>
                <span className="font-semibold text-ink">Kemas kini: </span>
                {metricText(dcs.metrics, "updated_text", "kemaskini")}
              </p>
            ) : null}
            {metricText(dcs.metrics, "footer", "footer_text") ? (
              <p className="mt-2 whitespace-pre-line">
                {metricText(dcs.metrics, "footer", "footer_text").replace(/\\n/g, "\n")}
              </p>
            ) : null}
            <SourceLink
              url={metricText(dcs.metrics, "source_url")}
              label={metricText(dcs.metrics, "source_label") || "Buka sumber DCS"}
            />
          </div>
        </div>
      </section>

      {/* ---------- AINS ---------- */}
      <section id="ains" className="mt-12 scroll-mt-28">
        <h2 className="text-xl font-semibold">Program Ains (Pembacaan Digital)</h2>
        <div className="mt-4">
          <AnalisisKpiTiles tiles={ainsTiles} />
        </div>
        <div className="mt-4">
          <BreakdownBarChart
            title="Buku Diluluskan Ikut Jenis Sekolah"
            data={ainsBars}
            seriesName="Buku"
          />
        </div>
        <SourceLink
          url={metricText(ains.metrics, "source_url")}
          label={metricText(ains.metrics, "source_label") || "Buka sumber Ains"}
        />
      </section>

      {/* ---------- Pensijilan ---------- */}
      <section id="pensijilan" className="mt-12 scroll-mt-28">
        <h2 className="text-xl font-semibold">Pensijilan Digital</h2>
        {metricText(pensijilan.metrics, "intro") ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-graphite">
            {metricText(pensijilan.metrics, "intro")}
          </p>
        ) : null}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BreakdownBarChart title="Ikut Lokasi" data={pensijilanLokasi} seriesName="Sijil" />
          <BreakdownBarChart
            title="Ikut Jenis Sekolah"
            data={pensijilanSekolah}
            seriesName="Sijil"
          />
        </div>
        <div className="flex gap-4">
          <SourceLink
            url={metricText(pensijilan.metrics, "image_url")}
            label={metricText(pensijilan.metrics, "image_label") || "Lihat infografik penuh"}
          />
          <SourceLink
            url={metricText(pensijilan.metrics, "source_url")}
            label={metricText(pensijilan.metrics, "source_label") || "Buka sumber"}
          />
        </div>
      </section>

      {/* ---------- OPTIK ---------- */}
      <section id="optik" className="mt-12 scroll-mt-28">
        <h2 className="text-xl font-semibold">AI Tools (OPTIK)</h2>
        {metricText(optik.metrics, "as_at") ? (
          <p className="mt-1 text-sm text-graphite">
            Setakat {metricText(optik.metrics, "as_at")}
          </p>
        ) : null}
        <div className="mt-4">
          <AnalisisKpiTiles tiles={optikTiles} />
        </div>
        <div className="mt-4">
          <MonthlyLineChart
            title="Perkembangan Penggunaan AI Tools (%)"
            data={optikSeries}
            seriesName="%"
          />
        </div>
        {metricText(optik.metrics, "footer_note") ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite">
            {metricText(optik.metrics, "footer_note")}
          </p>
        ) : null}
        <SourceLink
          url={metricText(optik.metrics, "source_url")}
          label={metricText(optik.metrics, "source_label") || "Buka sumber OPTIK"}
        />
      </section>
    </div>
  );
}
