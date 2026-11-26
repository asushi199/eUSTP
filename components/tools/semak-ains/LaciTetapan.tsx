"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Jalur, KodSebab, Ukuran, Warna } from "@/lib/tools/semak-ains/jenis";
import { KOMEN_LALAI, LABEL_SEBAB } from "@/lib/tools/semak-ains/komen";
import type { Ambang, ModPeraturan, Standard } from "@/lib/tools/semak-ains/standard";
import { Ikon, TitikWarna } from "./Ui";

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
const MEDAN: { kod: keyof Ambang; label: string; warna: Warna }[] = [
  { kod: "merah", label: "Cadang tolak jika <", warna: "merah" },
  { kod: "kuning", label: "Perlu semak jika <", warna: "kuning" },
  { kod: "panjang", label: "Perlu semak jika >", warna: "kuning" },
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
const TAB = [
  { kod: "panjang", label: "Panjang teks" },
  { kod: "peraturan", label: "Peraturan" },
  { kod: "komen", label: "Komen penolakan" },
] as const;
type KodTab = (typeof TAB)[number]["kod"];

type Props = {
  standard: Standard;
  diubah: boolean;
  onSimpan: (s: Standard) => void;
  onReset: () => void;
  onTutup: () => void;
};

/** Satu baris tetapan: label di kiri, kawalan di kanan (bertindan pada skrin kecil). */
function Baris({ tajuk, nota, children }: { tajuk: string; nota?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{tajuk}</span>
        {nota ? <span className="mt-0.5 block text-xs leading-relaxed text-graphite">{nota}</span> : null}
      </span>
      <span className="shrink-0 sm:w-56">{children}</span>
    </label>
  );
}

function Kumpulan({ tajuk, children }: { tajuk: string; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">{tajuk}</h3>
      <div className="mt-1 divide-y divide-fog">{children}</div>
    </section>
  );
}

export default function LaciTetapan({ standard, diubah, onSimpan, onReset, onTutup }: Props) {
  const [s, setS] = useState<Standard>(() => structuredClone(standard));
  const [tab, setTab] = useState<KodTab>("panjang");
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
    <select className="input h-10 px-3 text-sm" value={nilai} onChange={(e) => ubah(e.target.value as ModPeraturan)}>
      {(Object.keys(MOD_LABEL) as ModPeraturan[]).map((m) => (
        <option key={m} value={m}>
          {MOD_LABEL[m]}
        </option>
      ))}
    </select>
  );
  const inputNombor = "input h-10 px-3 text-sm tabular-nums";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tajukId}
      className="!m-auto w-[calc(100%-2rem)] max-w-3xl border-0 bg-transparent p-0 backdrop:bg-black/40"
    >
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-modal">
        <header className="border-b border-fog px-6 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={tajukId} className="text-lg font-semibold text-ink">
                Tetapan semakan
              </h2>
              <p className="mt-1 text-sm text-graphite">
                Disimpan dalam pelayar ini sahaja. Perbezaan daripada standard daerah dilaporkan kepada USTP (nilai
                tetapan sahaja, tiada data murid).
              </p>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
              aria-label="Tutup"
              onClick={onTutup}
            >
              <Ikon nama="tutup" />
            </button>
          </div>
          <div className="-mb-px mt-4 flex gap-1 overflow-x-auto" role="tablist" aria-label="Bahagian tetapan">
            {TAB.map((t) => (
              <button
                key={t.kod}
                type="button"
                role="tab"
                id={`${tajukId}-${t.kod}`}
                aria-selected={tab === t.kod}
                aria-controls={`${tajukId}-panel`}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
                  tab === t.kod ? "border-ink text-ink" : "border-transparent text-graphite hover:text-ink",
                )}
                onClick={() => setTab(t.kod)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <div
          id={`${tajukId}-panel`}
          role="tabpanel"
          aria-labelledby={`${tajukId}-${tab}`}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
        >
          {tab === "panjang" ? (
            <>
              <p className="text-sm leading-relaxed text-graphite">
                Jumlah panjang Rumusan + Pengajaran mengikut tahap murid.
              </p>
              {UKURAN.map((u) => (
                <fieldset key={u.kod} className="mt-5">
                  <legend className="text-sm font-semibold text-ink">{u.label}</legend>
                  <div className="mt-2 overflow-x-auto rounded-lg border border-fog">
                    <table className="w-full text-sm">
                      <thead className="bg-cloud text-left text-xs text-graphite">
                        <tr>
                          <th className="px-3 py-2 font-medium">Tahap</th>
                          {MEDAN.map((m) => (
                            <th key={m.kod} className="px-3 py-2 font-medium">
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <TitikWarna warna={m.warna} className="h-2 w-2" />
                                {m.label}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-fog">
                        {JALUR.map((j) => (
                          <tr key={j.kod}>
                            <td className="whitespace-nowrap px-3 py-2 text-charcoal">{j.label}</td>
                            {MEDAN.map((m) => (
                              <td key={m.kod} className="px-3 py-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  className="input h-9 w-24 px-2 text-center text-sm tabular-nums"
                                  aria-label={`${u.label}, ${j.label}: ${m.label}`}
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
              <div className="mt-6">
                <Kumpulan tajuk="Minimum setiap ruangan">
                  <Baris tajuk="Perkataan" nota="Rumusan atau Pengajaran lebih pendek = tidak lengkap (cadang tolak).">
                    <input
                      type="number"
                      min={0}
                      className={inputNombor}
                      value={s.minRuangan.kata}
                      onChange={(e) => setS({ ...s, minRuangan: { ...s.minRuangan, kata: Number(e.target.value) } })}
                    />
                  </Baris>
                  <Baris tajuk="Aksara Cina">
                    <input
                      type="number"
                      min={0}
                      className={inputNombor}
                      value={s.minRuangan.zh}
                      onChange={(e) => setS({ ...s, minRuangan: { ...s.minRuangan, zh: Number(e.target.value) } })}
                    />
                  </Baris>
                </Kumpulan>
              </div>
            </>
          ) : null}

          {tab === "peraturan" ? (
            <>
              <Kumpulan tajuk="Pendua">
                <Baris tajuk="Hantar semula teks sama" nota="Buku sama, teks tidak dipinda.">
                  {pilihMod(s.hantarSemulaSama, (m) => setS({ ...s, hantarSemulaSama: m }))}
                </Baris>
                <Baris tajuk="Buku sama direkod semula" nota="Teks berbeza.">
                  {pilihMod(s.bukuSamaBerulang, (m) => setS({ ...s, bukuSamaBerulang: m }))}
                </Baris>
                <Baris tajuk="Teks sama rakan sekelas" nota="Buku & hari sama — biasanya aktiviti kelas.">
                  <select
                    className="input h-10 px-3 text-sm"
                    value={s.aktivitiKelas}
                    onChange={(e) => setS({ ...s, aktivitiKelas: e.target.value as "benar" | "kuning" })}
                  >
                    <option value="benar">Benarkan (aktiviti kelas)</option>
                    <option value="kuning">Perlu semak (kuning)</option>
                  </select>
                </Baris>
              </Kumpulan>
              <Kumpulan tajuk="Bahasa & kandungan">
                <Baris tajuk="Bahasa bercampur" nota="Rumusan dan Pengajaran dalam bahasa berbeza.">
                  {pilihMod(s.bahasaBercampur, (m) => setS({ ...s, bahasaBercampur: m }))}
                </Baris>
                <Baris tajuk="Bahasa tidak sepadan" nota="Tajuk Cina/Tamil tetapi rumusan dalam bahasa lain → cadang tolak.">
                  <span className="flex sm:justify-end">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-ink"
                      checked={s.bahasaTakSepadan}
                      onChange={(e) => setS({ ...s, bahasaTakSepadan: e.target.checked })}
                    />
                  </span>
                </Baris>
                <Baris tajuk="Tiada unsur pengajaran" nota="Pengajaran tidak menyatakan nilai/pengajaran → perlu semak.">
                  <span className="flex sm:justify-end">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-ink"
                      checked={s.semakUnsurPengajaran}
                      onChange={(e) => setS({ ...s, semakUnsurPengajaran: e.target.checked })}
                    />
                  </span>
                </Baris>
              </Kumpulan>
              <Kumpulan tajuk="Lain-lain">
                <Baris tajuk="Ambang murid luar biasa" nota="Bilangan rekod seorang murid dalam satu bacaan.">
                  <input
                    type="number"
                    min={1}
                    className={inputNombor}
                    value={s.ambangMuridLuarBiasa}
                    onChange={(e) => setS({ ...s, ambangMuridLuarBiasa: Number(e.target.value) })}
                  />
                </Baris>
                <Baris tajuk="Jeda antara tindakan (ms)" nota="300–2000 ms. Lebih perlahan = lebih selamat untuk pelayan AINS.">
                  <input
                    type="number"
                    min={300}
                    max={2000}
                    className={inputNombor}
                    value={s.jedaMs}
                    onChange={(e) => setS({ ...s, jedaMs: Number(e.target.value) })}
                  />
                </Baris>
              </Kumpulan>
            </>
          ) : null}

          {tab === "komen" ? (
            <>
              <p className="text-sm leading-relaxed text-graphite">
                Komen dihantar kepada murid apabila rekod ditolak, mengikut sebab. Boleh disunting lagi sebelum setiap
                penolakan.
              </p>
              {[
                { tajuk: "Sebab cadang tolak", warna: "merah" as const, senarai: KOMEN_MERAH },
                { tajuk: "Sebab perlu semak", warna: "kuning" as const, senarai: KOMEN_KUNING },
              ].map((kumpulan) => (
                <section key={kumpulan.tajuk} className="mt-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <TitikWarna warna={kumpulan.warna} className="h-2 w-2" />
                    {kumpulan.tajuk}
                  </h3>
                  <div className="mt-3 space-y-4">
                    {kumpulan.senarai.map((k) => (
                      <label key={k} className="block">
                        <span className="label">{LABEL_SEBAB[k]}</span>
                        <textarea
                          className="textarea mt-1 text-sm"
                          rows={2}
                          value={s.komen[k] ?? KOMEN_LALAI[k]}
                          onChange={(e) => setS({ ...s, komen: { ...s.komen, [k]: e.target.value } })}
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-fog bg-cloud/50 px-6 py-4">
          <button type="button" className="btn-outline-ink btn-sm" disabled={!diubah} onClick={onReset}>
            Kembali ke standard daerah
          </button>
          <div className="flex gap-2">
            <button ref={batalRef} type="button" className="btn-outline-ink btn-sm" onClick={onTutup}>
              Batal
            </button>
            <button type="button" className="btn-ink btn-sm" onClick={() => onSimpan(s)}>
              Simpan
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
