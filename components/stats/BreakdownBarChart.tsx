"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BreakdownPoint } from "@/lib/stats/types";

/**
 * Carta bar pecahan kategori — kad disembunyikan sepenuhnya apabila data
 * kosong (konvensyen: fungsi statistik yang belum tersedia pulangkan []).
 */
export default function BreakdownBarChart({
  title,
  data,
  seriesName = "Program",
}: {
  title: string;
  data: BreakdownPoint[];
  seriesName?: string;
}) {
  if (data.length === 0) return null;
  return (
    <div className="card p-5">
      <p className="font-semibold">{title}</p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, bottom: 24, left: -20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#636363" }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#636363" }} />
            <Tooltip
              cursor={{ fill: "#f7f7f7" }}
              contentStyle={{ borderRadius: 8, borderColor: "#e8e8e8", fontSize: 12 }}
            />
            <Bar dataKey="jumlah" name={seriesName} fill="#024ad8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
