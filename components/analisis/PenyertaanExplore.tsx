"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KpiGroups, { type KpiGroup } from "@/components/analisis/KpiGroups";
import {
  ANUGERAH,
  GURU,
  PENYERTAAN_RINGKASAN as R,
  PERTANDINGAN,
  SEKOLAH,
  TOP5_DATA,
  analisisPenyertaan,
  bilangan,
  namaSekolah,
  peratus,
} from "@/lib/analisis/penyertaan";

type Tab = "ringkasan" | "pertandingan" | "sekolah" | "top5" | "guru";

const TABS: { id: Tab; label: string }[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "pertandingan", label: "Pertandingan" },
  { id: "sekolah", label: "Sekolah" },
  { id: "top5", label: "Top 5" },
  { id: "guru", label: "Guru" },
];

const GURU_RINGKAS = 10;

const KPI_GROUPS: KpiGroup[] = [
  {
    title: "Penyertaan & Pencapaian",
    wide: true,
    stats: [
      { label: "Penyertaan", value: bilangan(R.penyertaan) },
      { label: "Sekolah terlibat", value: bilangan(R.sekolahTerlibat) },
      { label: "Top 5", value: bilangan(R.top5) },
      { label: "Mata pencapaian", value: bilangan(R.mata) },
    ],
  },
  {
    title: "Sijil Dimenangi",
    wide: true,
    stats: [
      { label: "Jumlah sijil", value: bilangan(R.sijilJumlah) },
      { label: "Pencapaian Top 5 (murid + guru)", value: bilangan(R.sijilPencapaian) },
      { label: "Anugerah penyertaan sekolah", value: bilangan(R.sijilSekolah) },
      { label: "Guru pembimbing terbaik", value: bilangan(R.sijilGuruTerbaik) },
    ],
  },
  {
    title: "Kadar Kejayaan (Top 5 ÷ Penyertaan)",
    stats: [{ label: `${R.top5} / ${R.penyertaan}`, value: peratus((R.top5 / R.penyertaan) * 100) }],
  },
  {
    title: "Pertandingan Disertai",
    stats: [
      {
        label: "ada penyertaan Manjung",
        value: `${PERTANDINGAN.filter((p) => p.penyertaan > 0).length} / ${R.pertandinganJumlah}`,
      },
    ],
  },
];

/* ---------- Kepingan kecil ---------- */

function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-fog">
      <table className="w-full min-w-[34rem] border-collapse text-left text-[13px]">{children}</table>
    </div>
  );
}

function Th({ children, num }: { children?: ReactNode; num?: boolean }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap border-b border-fog bg-cloud/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.6px] text-steel ${num ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children, num, strong }: { children?: ReactNode; num?: boolean; strong?: boolean }) {
  return (
    <td
      className={`border-b border-fog/70 px-3 py-2 align-top ${num ? "text-right tabular-nums" : ""} ${strong ? "font-semibold text-ink" : "text-graphite"}`}
    >
      {children}
    </td>
  );
}

function AwardBadge({ anugerah }: { anugerah: string }) {
  const johan = anugerah === "JOHAN";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-semibold ${johan ? "bg-ink text-white" : "bg-cloud text-ink"}`}
    >
      {anugerah.charAt(0) + anugerah.slice(1).toLowerCase()}
    </span>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card p-5">
      <p className="font-semibold">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function NumberedList({ items }: { items: { tajuk: string; teks: string }[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={item.tajuk} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{item.tajuk}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-graphite">{item.teks}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

const tooltipStyle = { borderRadius: 8, borderColor: "#e8e8e8", fontSize: 12 };

/* ---------- Panel ---------- */

function Ringkasan() {
  const { dapatan, susulan, nota } = useMemo(() => analisisPenyertaan(), []);
  const data = PERTANDINGAN.filter((p) => p.penyertaan > 0).map((p) => ({
    label: p.kod,
    penyertaan: p.kongsiPenyertaan,
    top5: p.kongsiTop5,
  }));
  return (
    <div className="space-y-4">
      <KpiGroups groups={KPI_GROUPS} />
      <Panel title="Dapatan utama">
        <NumberedList items={dapatan} />
      </Panel>
      <div className="card p-5">
        <p className="font-semibold">Sumbangan mengikut pertandingan (%)</p>
        <p className="mt-1 text-xs text-graphite">
          Kongsi daripada jumlah penyertaan berbanding kongsi daripada jumlah Top 5 Manjung.
        </p>
        <div className="mt-3 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" horizontal={false} />
              <XAxis
                type="number"
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#636363" }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={82}
                tick={{ fontSize: 11, fill: "#636363" }}
              />
              <Tooltip
                cursor={{ fill: "#f7f7f7" }}
                contentStyle={tooltipStyle}
                formatter={(v) => `${v}%`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="penyertaan" name="% Penyertaan" fill="#636363" radius={[0, 3, 3, 0]} />
              <Bar dataKey="top5" name="% Top 5" fill="#024ad8" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Panel title="Cadangan susulan (untuk perbincangan)">
        <NumberedList items={susulan} />
      </Panel>
      <details className="rounded-lg border border-fog px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Nota data &amp; kaedah</summary>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-graphite">
          {nota.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Pertandingan() {
  const { kadarKeseluruhan } = useMemo(() => analisisPenyertaan(), []);
  const jumlahNegeri = PERTANDINGAN.reduce((a, p) => a + p.penyertaanNegeri, 0);
  return (
    <div className="space-y-3">
      <DataTable>
        <thead>
          <tr>
            <Th>Pertandingan</Th>
            <Th num>Penyertaan</Th>
            <Th num>% Perak</Th>
            <Th num>Sekolah</Th>
            <Th num>Top 5</Th>
            <Th num>Kadar</Th>
            <Th num>Mata</Th>
            <Th num>Kedudukan</Th>
          </tr>
        </thead>
        <tbody>
          {PERTANDINGAN.map((p) => (
            <tr key={p.kod}>
              <Td strong>
                {p.kod}
                {p.penyertaan === 0 ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-graphite">
                    Tiada penyertaan daerah ini
                  </span>
                ) : null}
              </Td>
              <Td num>{bilangan(p.penyertaan)}</Td>
              <Td num>{p.kongsiNegeri == null ? "—" : peratus(p.kongsiNegeri)}</Td>
              <Td num>{p.sekolahUnik}</Td>
              <Td num>{p.top5}</Td>
              <Td num>{p.kadar == null ? "—" : peratus(p.kadar)}</Td>
              <Td num>{p.mata}</Td>
              <Td num>
                {p.kedudukan} / {R.daerahPerak}
              </Td>
            </tr>
          ))}
          <tr className="bg-cloud/40">
            <Td strong>Jumlah Manjung</Td>
            <Td num strong>
              {bilangan(R.penyertaan)}
            </Td>
            <Td num strong>
              {peratus((R.penyertaan / jumlahNegeri) * 100)}
            </Td>
            <Td num strong>
              {R.sekolahTerlibat}
            </Td>
            <Td num strong>
              {R.top5}
            </Td>
            <Td num strong>
              {peratus(kadarKeseluruhan)}
            </Td>
            <Td num strong>
              {R.mata}
            </Td>
            <Td num>—</Td>
          </tr>
        </tbody>
      </DataTable>
      <p className="text-xs leading-relaxed text-graphite">
        % Perak = penyertaan Manjung ÷ penyertaan seluruh Perak ({bilangan(jumlahNegeri)}). Sekolah pada baris
        jumlah ialah bilangan sekolah unik (satu sekolah boleh menyertai lebih daripada satu pertandingan).
        Kedudukan ialah antara {R.daerahPerak} daerah Perak seperti dalam fail.
      </p>
    </div>
  );
}

function Sekolah() {
  const mata = SEKOLAH.filter((s) => s.mata > 0)
    .sort((a, b) => b.mata - a.mata)
    .map((s) => ({ label: s.nama, mata: s.mata }));
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <p className="font-semibold">Mata pencapaian ikut sekolah</p>
        <div className="mt-3" style={{ height: Math.max(220, mata.length * 30 + 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mata} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#636363" }} />
              <YAxis
                type="category"
                dataKey="label"
                width={170}
                interval={0}
                tick={{ fontSize: 10, fill: "#636363" }}
              />
              <Tooltip cursor={{ fill: "#f7f7f7" }} contentStyle={tooltipStyle} />
              <Bar
                dataKey="mata"
                name="Mata"
                fill="#1a1a1a"
                radius={[0, 3, 3, 0]}
                label={{ position: "right", fontSize: 11, fill: "#1a1a1a" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <DataTable>
        <thead>
          <tr>
            <Th num>Bil</Th>
            <Th>Sekolah</Th>
            <Th num>Penyertaan</Th>
            <Th num>Top 5</Th>
            <Th num>Mata</Th>
            <Th num>Kadar</Th>
            <Th>Pertandingan</Th>
          </tr>
        </thead>
        <tbody>
          {SEKOLAH.map((s, i) => (
            <tr key={s.kod}>
              <Td num>{i + 1}</Td>
              <Td strong>
                {s.nama}
                <span className="mt-0.5 block text-[11px] font-normal text-graphite">
                  {s.kod} · {s.jenis}
                </span>
              </Td>
              <Td num>{s.jumlah}</Td>
              <Td num>{s.top5}</Td>
              <Td num>{s.mata}</Td>
              <Td num>{peratus(s.kadar)}</Td>
              <Td>
                {Object.entries(s.penyertaan)
                  .map(([kod, n]) => `${kod} ${n}`)
                  .join(" · ")}
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <p className="text-xs leading-relaxed text-graphite">
        Disusun ikut skor (penyertaan + mata), seperti dalam fail rumusan.
      </p>
    </div>
  );
}

function Top5() {
  const groups: KpiGroup[] = [
    {
      title: `Anugerah Top 5 · ${R.top5} pencapaian`,
      wide: true,
      align: "center",
      stats: ANUGERAH.map((a) => ({
        label: a.nama.charAt(0) + a.nama.slice(1).toLowerCase(),
        value: String(a.bil),
      })),
    },
  ];
  return (
    <div className="space-y-4">
      <KpiGroups groups={groups} />
      <DataTable>
        <thead>
          <tr>
            <Th>Pertandingan</Th>
            <Th>Anugerah</Th>
            <Th>Sekolah</Th>
            <Th>Guru pembimbing</Th>
            <Th num>Mata</Th>
          </tr>
        </thead>
        <tbody>
          {TOP5_DATA.map((t, i) => (
            <tr key={`${t.pertandingan}-${t.kodSekolah}-${i}`}>
              <Td strong>
                {t.pertandingan}
                {t.kategori ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-graphite">{t.kategori}</span>
                ) : null}
              </Td>
              <Td>
                <AwardBadge anugerah={t.anugerah} />
              </Td>
              <Td>{namaSekolah(t.kodSekolah)}</Td>
              <Td>{t.guru}</Td>
              <Td num>{t.mata}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <p className="text-xs leading-relaxed text-graphite">
        Nama murid tidak dipaparkan. Mata: Johan 5 · Naib Johan 4 · Ketiga 3 · Keempat 2 · Kelima 1.
      </p>
    </div>
  );
}

function Guru() {
  const [semua, setSemua] = useState(false);
  const senarai = semua ? GURU : GURU.slice(0, GURU_RINGKAS);
  return (
    <div className="space-y-3">
      <DataTable>
        <thead>
          <tr>
            <Th num>#</Th>
            <Th>Guru pembimbing</Th>
            <Th num>Penyertaan</Th>
            <Th num>Top 5</Th>
            <Th num>Mata</Th>
            <Th>Pertandingan</Th>
          </tr>
        </thead>
        <tbody>
          {senarai.map((g) => (
            <tr key={`${g.nama}-${g.kodSekolah}`}>
              <Td num>{g.kedudukan}</Td>
              <Td strong>
                {g.nama}
                <span className="mt-0.5 block text-[11px] font-normal text-graphite">{g.sekolah}</span>
              </Td>
              <Td num>{g.pasukan}</Td>
              <Td num>{g.top5}</Td>
              <Td num>{g.mata}</Td>
              <Td>{g.pertandingan.join(", ")}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      {GURU.length > GURU_RINGKAS ? (
        <button type="button" className="btn-outline-ink btn-sm" onClick={() => setSemua((v) => !v)}>
          {semua ? "Papar 10 teratas" : `Papar semua (${GURU.length})`}
        </button>
      ) : null}
      <p className="text-xs leading-relaxed text-graphite">
        {GURU.length} guru unik ({R.guruBaris} baris dalam fail; rekod guru dan sekolah yang sama dengan ejaan nama
        berbeza digabung). Skor = penyertaan + mata. Penyertaan MYCH tidak termasuk kerana nama guru tiada dalam
        pendaftaran.
      </p>
    </div>
  );
}

/**
 * Modal kad "Penyertaan Pertandingan" (CoE Analytics): ringkasan, pertandingan, sekolah,
 * pencapaian Top 5 dan guru daripada fail rumusan daerah. Dimuat malas (mengandungi recharts).
 */
export default function PenyertaanExplore() {
  const [tab, setTab] = useState<Tab>("ringkasan");
  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink">
          {R.program} · Daerah {R.daerah}
        </p>
        <p className="mt-0.5 text-xs text-graphite">
          {R.tajuk} · Data setakat {R.tarikhJana}
        </p>
      </div>
      <div role="tablist" aria-label="Bahagian penyertaan" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              tab === t.id ? "bg-ink text-white" : "border border-fog text-graphite hover:bg-cloud hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "ringkasan" ? <Ringkasan /> : null}
        {tab === "pertandingan" ? <Pertandingan /> : null}
        {tab === "sekolah" ? <Sekolah /> : null}
        {tab === "top5" ? <Top5 /> : null}
        {tab === "guru" ? <Guru /> : null}
      </div>
    </div>
  );
}
