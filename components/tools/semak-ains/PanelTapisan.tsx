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

/** Label kod tahap enjin (D4, T2, P, ?) untuk paparan. */
export function labelKodTahap(kod: string): string {
  return TAHUN.find(([v]) => v === kod)?.[1] ?? "Tidak dikenal pasti";
}

/** Label ringkas tapisan semasa, cth. "Tahun 4 · kelas 4D" atau "Semua tahap". */
export function labelTapisan(t: Tapisan): string {
  const tahun = TAHUN.find(([v]) => v === (t.tahun ?? ""))?.[1] ?? "Semua";
  const bahagian = [tahun === "Semua" ? "Semua tahap" : tahun];
  if (t.kelas) bahagian.push(`kelas ${t.kelas}`);
  return bahagian.join(" · ");
}

export default function PanelTapisan({
  onMula,
  onBatal,
  awal,
  dimatikan = false,
}: {
  onMula: (t: Tapisan) => void;
  /** Kembali ke keputusan bacaan sebelum ini (hanya jika sudah ada bacaan). */
  onBatal?: () => void;
  /** Tapisan bacaan sebelum ini (untuk diisi semula apabila menukar tahun/kelas). */
  awal?: Tapisan;
  /** Sambungan dengan tab AINS terputus — bacaan tidak boleh dimulakan. */
  dimatikan?: boolean;
}) {
  const [tahun, setTahun] = useState(awal?.tahun ?? "");
  const [kelas, setKelas] = useState(awal?.kelas ?? "");
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">Pilih rekod untuk disemak</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-graphite">
        Baca semua rekod yang menunggu pengesahan, atau hadkan kepada satu tahun/kelas jika rekod terlalu banyak.
        Bacaan dibuat melalui sesi AINS anda — lebih kurang 1 minit bagi 1,500 rekod.
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          onMula({ tahun: tahun || undefined, kelas: kelas.trim() || undefined });
        }}
      >
        <label className="block">
          <span className="label">Tahun / Tingkatan</span>
          <select className="input" value={tahun} onChange={(e) => setTahun(e.target.value)}>
            {TAHUN.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">
            Nama kelas <span className="font-normal text-graphite">(pilihan)</span>
          </span>
          <input className="input" value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="cth. 4D" />
        </label>
        <div className="flex gap-2">
          {onBatal ? (
            <button type="button" className="btn-outline-ink flex-1 sm:flex-none" onClick={onBatal}>
              Batal
            </button>
          ) : null}
          <button type="submit" className="btn-primary flex-1 sm:flex-none" disabled={dimatikan}>
            Mula baca
          </button>
        </div>
      </form>
    </section>
  );
}
