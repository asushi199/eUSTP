"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Jalur, KodSebab, Ukuran } from "@/lib/tools/semak-ains/jenis";
import { KOMEN_LALAI, LABEL_SEBAB } from "@/lib/tools/semak-ains/komen";
import type { Ambang, ModPeraturan, Standard } from "@/lib/tools/semak-ains/standard";

const JALUR: { kod: Jalur; label: string }[] = [
  { kod: "D1-2", label: "Tahun 1–2" },
  { kod: "D3-4", label: "Tahun 3–4" },
  { kod: "D5-6", label: "Tahun 5–6" },
  { kod: "M", label: "Menengah / Peralihan" },
];
const UKURAN: { kod: Ukuran; label: string }[] = [
  { kod: "kata", label: "BM / BI / Tamil (perkataan)" },
  { kod: "zh", label: "Cina (aksara)" },
];
const MEDAN: { kod: keyof Ambang; label: string }[] = [
  { kod: "merah", label: "Merah di bawah" },
  { kod: "kuning", label: "Kuning di bawah" },
  { kod: "panjang", label: "Kuning melebihi" },
];
const KOMEN_MERAH: KodSebab[] = [
  "ruangan-kosong",
  "terlalu-pendek",
  "templat",
  "rumusan-sama-pengajaran",
  "hantar-semula-sama",
  "teks-rawak",
  "bahasa-tak-sepadan",
];
const KOMEN_KUNING: KodSebab[] = [
  "agak-pendek",
  "terlalu-panjang",
  "rumusan-sama-2-buku",
  "sama-murid-lain",
  "buku-sama-berulang",
  "simbol-pengisi",
  "tiada-unsur-pengajaran",
  "bahasa-bercampur",
];
const MOD_LABEL: Record<ModPeraturan, string> = {
  merah: "Cadang tolak (merah)",
  kuning: "Perlu semak (kuning)",
  abai: "Benarkan",
};

type Props = {
  standard: Standard;
  diubah: boolean;
  onSimpan: (s: Standard) => void;
  onReset: () => void;
  onTutup: () => void;
};

export default function LaciTetapan({ standard, diubah, onSimpan, onReset, onTutup }: Props) {
  const [s, setS] = useState<Standard>(() => structuredClone(standard));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const batalRef = useRef<HTMLButtonElement>(null);
  const tajukId = useId();
  const tutupRef = useRef(onTutup);
  tutupRef.current = onTutup;

  // Dialog asli: showModal() memberi latar inert, kurungan fokus & Escape.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    // Escape: pelayar hantar "cancel" lalu "close"; hanya tutup bila dialog benar-benar tertutup.
    const onClose = () => {
      if (!el.open) tutupRef.current();
    };
    el.addEventListener("close", onClose);
    if (!el.open) el.showModal();
    batalRef.current?.focus();
    return () => {
      el.removeEventListener("close", onClose);
      if (el.open) el.close();
    };
  }, []);

  const setAmbang = (u: Ukuran, j: Jalur, m: keyof Ambang, v: number) =>
    setS((x) => {
      const y = structuredClone(x);
      y.ambang[u][j][m] = v;
      return y;
    });
  const pilihMod = (nilai: ModPeraturan, ubah: (m: ModPeraturan) => void) => (
    <select className="input mt-1" value={nilai} onChange={(e) => ubah(e.target.value as ModPeraturan)}>
      {(Object.keys(MOD_LABEL) as ModPeraturan[]).map((m) => (
        <option key={m} value={m}>
          {MOD_LABEL[m]}
        </option>
      ))}
    </select>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tajukId}
      className="m-auto w-[calc(100%-2rem)] max-w-3xl border-0 bg-transparent p-0 backdrop:bg-black/40"
    >
      <div className="card max-h-[90vh] w-full overflow-y-auto bg-white p-6">
        <h2 id={tajukId} className="text-lg font-semibold text-ink">Tetapan semakan</h2>
        <p className="mt-1 text-sm text-graphite">
          Disimpan dalam pelayar ini sahaja. Perbezaan daripada standard daerah dilaporkan kepada USTP
          (nilai tetapan sahaja, tiada data murid).
        </p>

        {UKURAN.map((u) => (
          <fieldset key={u.kod} className="mt-6">
            <legend className="font-semibold text-ink">{u.label}</legend>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-graphite">
                    <th className="py-1 pr-2">Tahap</th>
                    {MEDAN.map((m) => (
                      <th key={m.kod} className="py-1 pr-2">
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JALUR.map((j) => (
                    <tr key={j.kod}>
                      <td className="py-1 pr-2">{j.label}</td>
                      {MEDAN.map((m) => (
                        <td key={m.kod} className="py-1 pr-2">
                          <input
                            type="number"
                            min={0}
                            className="input w-24"
                            value={s.ambang[u.kod][j.kod][m.kod]}
                            onChange={(e) => setAmbang(u.kod, j.kod, m.kod, Number(e.target.value))}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>
        ))}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Hantar semula teks sama (buku sama)</span>
            {pilihMod(s.hantarSemulaSama, (m) => setS({ ...s, hantarSemulaSama: m }))}
          </label>
          <label className="block">
            <span className="label">Buku sama direkod semula (teks berbeza)</span>
            {pilihMod(s.bukuSamaBerulang, (m) => setS({ ...s, bukuSamaBerulang: m }))}
          </label>
          <label className="block">
            <span className="label">Bahasa Rumusan & Pengajaran berbeza (bahasa bercampur)</span>
            {pilihMod(s.bahasaBercampur, (m) => setS({ ...s, bahasaBercampur: m }))}
          </label>
          <label className="block">
            <span className="label">Teks sama rakan sekelas (buku & hari sama)</span>
            <select
              className="input mt-1"
              value={s.aktivitiKelas}
              onChange={(e) => setS({ ...s, aktivitiKelas: e.target.value as "benar" | "kuning" })}
            >
              <option value="benar">Benarkan (aktiviti kelas)</option>
              <option value="kuning">Perlu semak (kuning)</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Ambang murid luar biasa (bilangan rekod)</span>
            <input type="number" min={1} className="input mt-1" value={s.ambangMuridLuarBiasa} onChange={(e) => setS({ ...s, ambangMuridLuarBiasa: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="label">Jeda antara tindakan (ms, 300–2000)</span>
            <input type="number" min={300} max={2000} className="input mt-1" value={s.jedaMs} onChange={(e) => setS({ ...s, jedaMs: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="label">Minimum setiap ruangan — perkataan</span>
            <input type="number" min={0} className="input mt-1" value={s.minRuangan.kata} onChange={(e) => setS({ ...s, minRuangan: { ...s.minRuangan, kata: Number(e.target.value) } })} />
          </label>
          <label className="block">
            <span className="label">Minimum setiap ruangan — aksara Cina</span>
            <input type="number" min={0} className="input mt-1" value={s.minRuangan.zh} onChange={(e) => setS({ ...s, minRuangan: { ...s.minRuangan, zh: Number(e.target.value) } })} />
          </label>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.bahasaTakSepadan} onChange={(e) => setS({ ...s, bahasaTakSepadan: e.target.checked })} />
            Cadang tolak jika tajuk Cina/Tamil tetapi rumusan dalam bahasa lain
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.semakUnsurPengajaran} onChange={(e) => setS({ ...s, semakUnsurPengajaran: e.target.checked })} />
            Tanda kuning jika Pengajaran tiada unsur pengajaran
          </label>
        </div>

        <fieldset className="mt-6">
          <legend className="font-semibold text-ink">Komen penolakan kepada murid</legend>
          {[
            { tajuk: "Sebab merah", senarai: KOMEN_MERAH },
            { tajuk: "Sebab kuning", senarai: KOMEN_KUNING },
          ].map((kumpulan) => (
            <div key={kumpulan.tajuk} className="mt-4">
              <p className="text-xs font-semibold uppercase text-graphite">{kumpulan.tajuk}</p>
              {kumpulan.senarai.map((k) => (
                <label key={k} className="mt-3 block">
                  <span className="label">{LABEL_SEBAB[k]}</span>
                  <textarea
                    className="textarea mt-1"
                    rows={2}
                    value={s.komen[k] ?? KOMEN_LALAI[k]}
                    onChange={(e) => setS({ ...s, komen: { ...s.komen, [k]: e.target.value } })}
                  />
                </label>
              ))}
            </div>
          ))}
        </fieldset>

        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <button type="button" className="btn-outline-ink" disabled={!diubah} onClick={onReset}>
            Kembali ke standard daerah
          </button>
          <div className="flex gap-2">
            <button ref={batalRef} type="button" className="btn-outline-ink" onClick={onTutup}>
              Batal
            </button>
            <button type="button" className="btn-ink" onClick={() => onSimpan(s)}>
              Simpan
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
