"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthPoint } from "@/lib/stats/types";

/** Carta garis bulanan (Jan–Dis) — gaya hp: garis biru tunggal, grid halus. */
export default function MonthlyLineChart({
  title,
  data,
  seriesName = "Laporan",
}: {
  title: string;
  data: MonthPoint[];
  seriesName?: string;
}) {
  if (data.length === 0 || data.every((d) => d.jumlah === 0)) return null;
  return (
    <div className="card p-5">
      <p className="font-semibold">{title}</p>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#636363" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#636363" }} />
            <Tooltip
              cursor={{ stroke: "#c2c2c2" }}
              contentStyle={{ borderRadius: 8, borderColor: "#e8e8e8", fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="jumlah"
              name={seriesName}
              stroke="#024ad8"
              strokeWidth={2}
              dot={{ r: 3, fill: "#024ad8", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
