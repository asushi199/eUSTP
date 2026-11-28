"use client";

import { useState } from "react";
import type { Kamus } from "@/lib/tools/semak-ains/i18n";
import type { Tapisan } from "@/lib/tools/semak-ains/mesej";
import { useBahasa } from "./Bahasa";

const KOD_TAHUN = ["", "D1", "D2", "D3", "D4", "D5", "D6", "T1", "T2", "T3", "T4", "T5", "P"] as const;

/** Label kod tahap enjin (D4, T2, P, ?) untuk paparan, atau null jika tidak dikenali. */
function labelKod(kod: string, k: Kamus): string | null {
  if (kod === "") return k.tahap.semua;
  if (kod === "P") return k.tahap.peralihan;
  const m = kod.match(/^([DT])(\d)$/);
  if (!m) return null;
  return m[1] === "D" ? k.tahap.tahun(m[2] ?? "") : k.tahap.tingkatan(m[2] ?? "");
}

export function labelKodTahap(kod: string, k: Kamus): string {
  return labelKod(kod, k) ?? k.tahap.takDikenal;
}

/** Label ringkas tapisan semasa, cth. "Tahun 4 · kelas 4D" atau "Semua tahap". */
export function labelTapisan(t: Tapisan, k: Kamus): string {
  const bahagian = [t.tahun ? (labelKod(t.tahun, k) ?? k.tahap.semuaTahap) : k.tahap.semuaTahap];
  if (t.kelas) bahagian.push(k.tahap.kelas(t.kelas));
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
  const { k } = useBahasa();
  const [tahun, setTahun] = useState(awal?.tahun ?? "");
  const [kelas, setKelas] = useState(awal?.kelas ?? "");
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">{k.tapisan.tajuk}</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-graphite">{k.tapisan.huraian}</p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          onMula({ tahun: tahun || undefined, kelas: kelas.trim() || undefined });
        }}
      >
        <label className="block">
          <span className="label">{k.tapisan.tahun}</span>
          <select className="input" value={tahun} onChange={(e) => setTahun(e.target.value)}>
            {KOD_TAHUN.map((v) => (
              <option key={v} value={v}>
                {labelKodTahap(v, k)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">
            {k.tapisan.namaKelas} <span className="font-normal text-graphite">{k.tapisan.pilihan}</span>
          </span>
          <input className="input" value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder={k.tapisan.contohKelas} />
        </label>
        <div className="flex gap-2">
          {onBatal ? (
            <button type="button" className="btn-outline-ink flex-1 sm:flex-none" onClick={onBatal}>
              {k.umum.batal}
            </button>
          ) : null}
          <button type="submit" className="btn-primary flex-1 sm:flex-none" disabled={dimatikan}>
            {k.tapisan.mula}
          </button>
        </div>
      </form>
    </section>
  );
}
