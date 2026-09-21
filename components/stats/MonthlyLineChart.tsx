"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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
  referenceY,
  referenceLabel,
  percent = false,
}: {
  title: string;
  data: MonthPoint[];
  seriesName?: string;
  /** Garis mendatar sasaran (cth. KPI Kebangsaan). */
  referenceY?: number | null;
  referenceLabel?: string;
  percent?: boolean;
}) {
  if (data.length === 0 || data.every((d) => d.jumlah === 0)) return null;
  return (
    <div className="card p-5">
      <p className="font-semibold">{title}</p>
      <div className={`mt-3 ${referenceY != null ? "h-64" : "h-56"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 0, left: percent ? -8 : -20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#636363" }} />
            <YAxis
              domain={percent ? [0, 100] : undefined}
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#636363" }}
              tickFormatter={percent ? (v) => `${v}%` : undefined}
            />
            <Tooltip
              cursor={{ stroke: "#c2c2c2" }}
              contentStyle={{ borderRadius: 8, borderColor: "#e8e8e8", fontSize: 12 }}
              formatter={
                percent
                  ? (value) => [`${value}%`, seriesName]
                  : undefined
              }
            />
            {referenceY != null ? (
              <ReferenceLine
                y={referenceY}
                stroke="#636363"
                strokeDasharray="6 4"
                ifOverflow="extendDomain"
                label={{
                  value: referenceLabel ?? `KPI ${referenceY}%`,
                  fontSize: 10,
                  fill: "#636363",
                  position: "insideBottomLeft",
                }}
              />
            ) : null}
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
