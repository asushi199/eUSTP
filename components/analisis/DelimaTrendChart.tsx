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
  return (
    <div className="card p-5">
      <p className="font-semibold">Peratus Penggunaan DELIMa 2.0 Bulanan</p>
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
                stroke="#c2c2c2"
                strokeDasharray="6 4"
                label={{
                  value: `KPI Guru ${kpiGuru}%`,
                  fontSize: 10,
                  fill: "#636363",
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
              name="Guru"
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
      {ada23 && mula23 > 0 ? (
        <p className="mt-2 text-xs text-graphite">
          Murid 2.0+3.0 direkod mulai {data[mula23].bulan}; bulan sebelumnya tiada data.
        </p>
      ) : null}
    </div>
  );
}
