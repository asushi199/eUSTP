"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DelimaPoint = {
  bulan: string;
  guru: number | null;
  murid: number | null;
  /** Jumlah Aktif Murid DELIMa 2.0 + 3.0 (kad sasaran); null jika bulan itu tiada rekod. */
  murid23?: number | null;
  /** Guru gabungan 2.0 + 3.0 (dibandingkan dengan KPI guru); null jika bulan itu tiada rekod. */
  guruGab?: number | null;
  /** DELIMa 3.0 guru/murid; null bagi bulan sebelum 3.0 direkod. */
  guru30?: number | null;
  murid30?: number | null;
};

/** Trend % aktif DELIMa guru vs murid, dengan garis sasaran KPI guru dan murid. */
export default function DelimaTrendChart({
  data,
  kpiGuru,
  kpiMurid = null,
}: {
  data: DelimaPoint[];
  kpiGuru: number | null;
  kpiMurid?: number | null;
}) {
  if (data.length === 0) return null;
  const ada23 = data.some((d) => d.murid23 != null);
  const mula23 = data.findIndex((d) => d.murid23 != null);
  const adaGab = data.some((d) => d.guruGab != null);
  const mulaGab = data.findIndex((d) => d.guruGab != null);
  const ada30 = data.some((d) => d.guru30 != null || d.murid30 != null);
  const mula30 = data.findIndex((d) => d.guru30 != null || d.murid30 != null);
  const siri = [
    { nama: "DELIMa 3.0", mula: mula30 },
    { nama: "Guru 2.0+3.0", mula: mulaGab },
    { nama: "Murid 2.0+3.0", mula: mula23 },
  ].filter((x) => x.mula > 0);
  const mulaan = [...new Set(siri.map((x) => x.mula))].map((mula) => ({
    nama: siri.filter((x) => x.mula === mula).map((x) => x.nama).join(", "),
    bulan: data[mula].bulan,
  }));
  return (
    <div className="card p-5">
      <p className="font-semibold">
        Peratus Penggunaan DELIMa 2.0{ada30 ? " dan 3.0" : ""} Bulanan
      </p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 28, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#636363" }} />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#636363" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{ stroke: "#c2c2c2" }}
              contentStyle={{ borderRadius: 8, borderColor: "#e8e8e8", fontSize: 12 }}
              formatter={(value) => [`${value}%`]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {kpiGuru != null ? (
              <ReferenceLine
                y={kpiGuru}
                stroke="#024ad8"
                strokeDasharray="6 4"
                label={{
                  value: `KPI Guru ${kpiGuru}%`,
                  fontSize: 10,
                  fill: "#024ad8",
                  position: "insideBottomRight",
                }}
              />
            ) : null}
            {kpiMurid != null ? (
              <ReferenceLine
                y={kpiMurid}
                stroke="#c2c2c2"
                strokeDasharray="6 4"
                label={{
                  value: `KPI Murid ${kpiMurid}%`,
                  fontSize: 10,
                  fill: "#636363",
                  position: "insideTopRight",
                }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="guru"
              name={ada30 ? "Guru 2.0" : "Guru"}
              stroke="#024ad8"
              strokeWidth={2}
              dot={{ r: 3, fill: "#024ad8", strokeWidth: 0 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="murid"
              name="Murid 2.0"
              stroke="#636363"
              strokeWidth={2}
              dot={{ r: 3, fill: "#636363", strokeWidth: 0 }}
              connectNulls
            />
            {ada30 ? (
              <Line
                type="monotone"
                dataKey="guru30"
                name="Guru 3.0"
                stroke="#6f97ea"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: "#6f97ea", strokeWidth: 0 }}
                connectNulls
              />
            ) : null}
            {ada30 ? (
              <Line
                type="monotone"
                dataKey="murid30"
                name="Murid 3.0"
                stroke="#a6a6a6"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: "#a6a6a6", strokeWidth: 0 }}
                connectNulls
              />
            ) : null}
            {adaGab ? (
              <Line
                type="monotone"
                dataKey="guruGab"
                name="Guru 2.0+3.0"
                stroke="#024ad8"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 5, fill: "#ffffff", stroke: "#024ad8", strokeWidth: 2, strokeDasharray: "0" }}
                activeDot={{ r: 6 }}
                label={{
                  position: "top",
                  fontSize: 11,
                  fontWeight: 600,
                  fill: "#024ad8",
                  formatter: (v: unknown) => (v == null ? "" : `${v}%`),
                }}
                connectNulls
              />
            ) : null}
            {ada23 ? (
              <Line
                type="monotone"
                dataKey="murid23"
                name="Murid 2.0+3.0"
                stroke="#1a1a1a"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 5, fill: "#ffffff", stroke: "#1a1a1a", strokeWidth: 2, strokeDasharray: "0" }}
                activeDot={{ r: 6 }}
                label={{
                  position: "left",
                  fontSize: 11,
                  fontWeight: 600,
                  fill: "#1a1a1a",
                  formatter: (v: unknown) => (v == null ? "" : `${v}%`),
                }}
                connectNulls
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {mulaan.length > 0 ? (
        <p className="mt-2 text-xs text-graphite">
          {mulaan.map((m) => `${m.nama} direkod mulai ${m.bulan}`).join("; ")}; bulan sebelumnya tiada data.
        </p>
      ) : null}
    </div>
  );
}
