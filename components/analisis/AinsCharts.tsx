"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type AinsSeries = { key: string; name: string; color: string };

/** Carta garis bulanan berbilang siri (BM / BI / Lain-lain, dll.). */
export default function AinsLineChart({
  title,
  data,
  series,
  height = "h-60",
  bare = false,
}: {
  title?: string;
  data: Record<string, number | string>[];
  series: AinsSeries[];
  height?: string;
  /** Tanpa bingkai kad (dalam baris jadual yang dikembangkan). */
  bare?: boolean;
}) {
  if (data.length === 0) return null;
  const chart = (
    <div className={`${title ? "mt-3 " : ""}${height}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#636363" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#636363" }} />
          <Tooltip
            cursor={{ stroke: "#c2c2c2" }}
            contentStyle={{ borderRadius: 8, borderColor: "#e8e8e8", fontSize: 12 }}
            formatter={(v) => (typeof v === "number" ? v.toLocaleString("ms-MY") : String(v ?? ""))}
          />
          {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
  if (bare) return chart;
  return (
    <div className="card p-5">
      {title ? <p className="font-semibold">{title}</p> : null}
      {chart}
    </div>
  );
}
