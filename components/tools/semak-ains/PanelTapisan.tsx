"use client";

import { useState } from "react";
import type { Tapisan } from "@/lib/tools/semak-ains/mesej";

const TAHUN: [string, string][] = [
  ["", "Semua"],
  ["D1", "Tahun 1"],
  ["D2", "Tahun 2"],
  ["D3", "Tahun 3"],
  ["D4", "Tahun 4"],
  ["D5", "Tahun 5"],
  ["D6", "Tahun 6"],
  ["T1", "Tingkatan 1"],
  ["T2", "Tingkatan 2"],
  ["T3", "Tingkatan 3"],
  ["T4", "Tingkatan 4"],
  ["T5", "Tingkatan 5"],
  ["P", "Peralihan"],
];

/** Label ringkas tapisan semasa, cth. "Tahun 4 · kelas 4D" atau "Semua tahap". */
export function labelTapisan(t: Tapisan): string {
  const tahun = TAHUN.find(([v]) => v === (t.tahun ?? ""))?.[1] ?? "Semua";
  const bahagian = [tahun === "Semua" ? "Semua tahap" : tahun];
  if (t.kelas) bahagian.push(`kelas ${t.kelas}`);
  return bahagian.join(" · ");
}

export default function PanelTapisan({
  onMula,
  awal,
}: {
  onMula: (t: Tapisan) => void;
  /** Tapisan bacaan sebelum ini (untuk diisi semula apabila menukar tahun/kelas). */
  awal?: Tapisan;
}) {
  const [tahun, setTahun] = useState(awal?.tahun ?? "");
  const [kelas, setKelas] = useState(awal?.kelas ?? "");
  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold text-ink">Baca rekod menunggu pengesahan</h2>
      <p className="mt-1 text-sm text-graphite">
        Pilih tahap atau kelas jika rekod terlalu banyak. Bacaan dibuat dalam tab AINS anda
        (lebih kurang 1 minit bagi 1,500 rekod).
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Tahun / Tingkatan</span>
          <select className="input mt-1" value={tahun} onChange={(e) => setTahun(e.target.value)}>
            {TAHUN.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Nama kelas (pilihan)</span>
          <input
            className="input mt-1"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            placeholder="cth. 4D"
          />
        </label>
      </div>
      <button
        type="button"
        className="btn-primary mt-6"
        onClick={() => onMula({ tahun: tahun || undefined, kelas: kelas.trim() || undefined })}
      >
        Mula baca
      </button>
    </section>
  );
}
