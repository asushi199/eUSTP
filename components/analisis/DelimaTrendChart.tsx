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
};

/** Trend % aktif DELIMa guru vs murid, dengan garis sasaran KPI guru. */
export default function DelimaTrendChart({
  data,
  kpiGuru,
}: {
  data: DelimaPoint[];
  kpiGuru: number | null;
}) {
  if (data.length === 0) return null;
  return (
    <div className="card p-5">
      <p className="font-semibold">Peratus Penggunaan DELIMa Bulanan</p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
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
              name="Murid"
              stroke="#636363"
              strokeWidth={2}
              dot={{ r: 3, fill: "#636363", strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
