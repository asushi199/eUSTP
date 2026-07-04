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

export default function PssMonthlyChart({
  data,
}: {
  data: { bulan: string; jumlah: number }[];
}) {
  if (data.length === 0) return null;
  return (
    <div className="card p-5">
      <p className="font-semibold">Laporan PSS Sebulan</p>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#636363" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#636363" }} />
            <Tooltip
              cursor={{ fill: "#f7f7f7" }}
              contentStyle={{ borderRadius: 8, borderColor: "#e8e8e8", fontSize: 12 }}
            />
            <Bar dataKey="jumlah" name="Laporan" fill="#024ad8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
