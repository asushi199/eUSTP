"use client";

import { useMemo, useState } from "react";
import type { Bahasa, Keputusan, KodSebab, RekodAins, Warna } from "@/lib/tools/semak-ains/jenis";
import { LABEL_MAKLUMAT, LABEL_SEBAB } from "@/lib/tools/semak-ains/komen";
import { ASAL_AINS } from "@/lib/tools/semak-ains/mesej";
import type { StatusTindakan } from "./useSambunganAins";
import { WARNA_STATUS } from "./warna";

const LANGKAH = 100;
const LABEL_BAHASA: Record<Bahasa, string> = {
  zh: "Cina",
  ta: "Tamil",
  bm: "BM",
  en: "BI",
  campur: "Campuran",
  lain: "Lain",
};

type Props = {
  rekodIkutId: Map<string, RekodAins>;
  keputusan: Keputusan[];
  status: Map<string, StatusTindakan>;
  dipilih: Set<string>;
  onTogolPilih: (id: string) => void;
};

export function pautanAins(id: string): string {
  return `${ASAL_AINS}/web/teacher-record-details?id=${encodeURIComponent(id)}`;
}

export default function SenaraiRekod({
  rekodIkutId,
  keputusan,
  status,
  dipilih,
  onTogolPilih,
}: Props) {
  const [warna, setWarna] = useState<Warna | "semua">("semua");
  const [sebab, setSebab] = useState<KodSebab | "semua">("semua");
  const [tahap, setTahap] = useState("semua");
  const [cari, setCari] = useState("");
  const [had, setHad] = useState(LANGKAH);

  const sebabAda = useMemo(
    () => [...new Set(keputusan.flatMap((k) => [...k.merah, ...k.kuning]))],
    [keputusan],
  );
  const tahapAda = useMemo(() => [...new Set(keputusan.map((k) => k.kodTahap))].sort(), [keputusan]);
  const tapis = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return keputusan.filter((k) => {
      if (warna !== "semua" && k.warna !== warna) return false;
      if (sebab !== "semua" && !k.merah.includes(sebab) && !k.kuning.includes(sebab)) return false;
      if (tahap !== "semua" && k.kodTahap !== tahap) return false;
      if (q) {
        const r = rekodIkutId.get(k.id);
        if (!r || !`${r.murid} ${r.tajuk} ${r.kelas}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [keputusan, warna, sebab, tahap, cari, rekodIkutId]);

  const ubah = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setHad(LANGKAH);
  };

  return (
    <section className="card p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block">
          <span className="label">Status</span>
          <select className="input mt-1" value={warna} onChange={(e) => ubah(setWarna)(e.target.value as Warna | "semua")}>
            <option value="semua">Semua</option>
            <option value="hijau">{WARNA_STATUS.hijau.label}</option>
            <option value="kuning">{WARNA_STATUS.kuning.label}</option>
            <option value="merah">{WARNA_STATUS.merah.label}</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Sebab</span>
          <select className="input mt-1" value={sebab} onChange={(e) => ubah(setSebab)(e.target.value as KodSebab | "semua")}>
            <option value="semua">Semua</option>
            {sebabAda.map((s) => (
              <option key={s} value={s}>
                {LABEL_SEBAB[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Tahap</span>
          <select className="input mt-1" value={tahap} onChange={(e) => ubah(setTahap)(e.target.value)}>
            <option value="semua">Semua</option>
            {tahapAda.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Cari murid / tajuk</span>
          <input className="input mt-1" value={cari} onChange={(e) => ubah(setCari)(e.target.value)} />
        </label>
      </div>

      <p className="mt-4 text-sm text-graphite">{tapis.length.toLocaleString("ms-MY")} rekod dipaparkan</p>
      <ul className="mt-3 divide-y divide-cloud">
        {tapis.slice(0, had).map((k) => {
          const r = rekodIkutId.get(k.id);
          if (!r) return null;
          const st = status.get(k.id);
          const siap = st?.berjaya === true || st?.perluBacaSemula === true;
          /* Rekod kuning boleh dipilih terus (keputusan pengguna 2026-11-26); merah/hijau
           * tetap dihadkan oleh PanelTindakan (merah tidak boleh diluluskan, hijau tidak ditolak). */
          const bolehPilih = !siap;
          const w = WARNA_STATUS[k.warna];
          return (
            <li key={k.id} className="py-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={dipilih.has(k.id)}
                  disabled={!bolehPilih}
                  onChange={() => onTogolPilih(k.id)}
                  aria-label={`Pilih ${r.tajuk}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: w.teks }}>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: w.warna }} aria-hidden />
                      {w.label}
                    </span>
                    {st ? (
                      <span className="status-badge">
                        {st.berjaya
                          ? st.tindakan === "approved"
                            ? "Diluluskan"
                            : "Ditolak"
                          : `Gagal: ${st.jawapan ?? "ralat"}`}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-semibold text-ink">{r.tajuk}</p>
                  <p className="text-xs text-graphite">
                    {r.murid} · {r.kelas} · {LABEL_BAHASA[k.bahasa]} · {k.panjang}{" "}
                    {k.bahasa === "zh" ? "aksara" : "perkataan"}
                  </p>
                  {k.merah.length + k.kuning.length + k.maklumat.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {k.merah.map((s) => (
                        <span key={s} className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: `${WARNA_STATUS.merah.warna}14`, color: WARNA_STATUS.merah.teks }}>
                          {LABEL_SEBAB[s]}
                        </span>
                      ))}
                      {k.kuning.map((s) => (
                        <span key={s} className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: `${WARNA_STATUS.kuning.warna}14`, color: WARNA_STATUS.kuning.teks }}>
                          {LABEL_SEBAB[s]}
                        </span>
                      ))}
                      {k.maklumat.map((m) => (
                        <span key={m} className="rounded bg-cloud px-2 py-0.5 text-xs text-graphite">
                          {LABEL_MAKLUMAT[m]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-2 line-clamp-2 text-sm text-graphite">
                    <b>Rumusan:</b> {r.rumusan}
                  </p>
                  <p className="line-clamp-2 text-sm text-graphite">
                    <b>Pengajaran:</b> {r.pengajaran}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <a
                      className="text-ink underline"
                      href={pautanAins(k.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buka dalam AINS
                    </a>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {tapis.length > had ? (
        <button type="button" className="btn-outline-ink mt-4" onClick={() => setHad((h) => h + LANGKAH)}>
          Tunjuk {Math.min(LANGKAH, tapis.length - had)} lagi
        </button>
      ) : null}
    </section>
  );
}
