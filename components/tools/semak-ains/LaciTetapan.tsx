"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Jalur, KodSebab, Ukuran, Warna } from "@/lib/tools/semak-ains/jenis";
import type { Ambang, ModPeraturan, Standard } from "@/lib/tools/semak-ains/standard";
import { useBahasa } from "./Bahasa";
import { Ikon, TitikWarna } from "./Ui";

const JALUR: Jalur[] = ["D1-2", "D3-4", "D5-6", "M"];
const UKURAN: Ukuran[] = ["kata", "zh"];
const MEDAN: { kod: keyof Ambang; warna: Warna }[] = [
  { kod: "merah", warna: "merah" },
  { kod: "kuning", warna: "kuning" },
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
  "rumusan-sama-2-buku",
  "sama-murid-lain",
  "buku-sama-berulang",
  "simbol-pengisi",
  "tiada-unsur-pengajaran",
  "bahasa-bercampur",
];
const MOD: ModPeraturan[] = ["merah", "kuning", "abai"];
const TAB = ["panjang", "peraturan", "komen"] as const;
type KodTab = (typeof TAB)[number];

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
  const { k: kamus } = useBahasa();
  const T = kamus.tetapan;
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
      {MOD.map((m) => (
        <option key={m} value={m}>
          {T.mod[m]}
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
                {T.tajuk}
              </h2>
              <p className="mt-1 text-sm text-graphite">{T.huraian}</p>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-graphite hover:bg-cloud hover:text-ink"
              aria-label={kamus.umum.tutup}
              onClick={onTutup}
            >
              <Ikon nama="tutup" />
            </button>
          </div>
          <div className="-mb-px mt-4 flex gap-1 overflow-x-auto" role="tablist" aria-label={T.bahagian}>
            {TAB.map((kod) => (
              <button
                key={kod}
                type="button"
                role="tab"
                id={`${tajukId}-${kod}`}
                aria-selected={tab === kod}
                aria-controls={`${tajukId}-panel`}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
                  tab === kod ? "border-ink text-ink" : "border-transparent text-graphite hover:text-ink",
                )}
                onClick={() => setTab(kod)}
              >
                {T.tab[kod]}
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
              <p className="text-sm leading-relaxed text-graphite">{T.panjangHuraian}</p>
              {UKURAN.map((u) => (
                <fieldset key={u} className="mt-5">
                  <legend className="text-sm font-semibold text-ink">{T.ukuran[u]}</legend>
                  <div className="mt-2 overflow-x-auto rounded-lg border border-fog">
                    <table className="w-full text-sm">
                      <thead className="bg-cloud text-left text-xs text-graphite">
                        <tr>
                          <th className="px-3 py-2 font-medium">{T.lajurTahap}</th>
                          {MEDAN.map((m) => (
                            <th key={m.kod} className="px-3 py-2 font-medium">
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <TitikWarna warna={m.warna} className="h-2 w-2" />
                                {m.kod === "merah" ? T.tolakJika : T.semakJika}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-fog">
                        {JALUR.map((j) => (
                          <tr key={j}>
                            <td className="whitespace-nowrap px-3 py-2 text-charcoal">{T.jalur[j]}</td>
                            {MEDAN.map((m) => (
                              <td key={m.kod} className="px-3 py-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  className="input h-9 w-24 px-2 text-center text-sm tabular-nums"
                                  aria-label={`${T.ukuran[u]}, ${T.jalur[j]}: ${m.kod === "merah" ? T.tolakJika : T.semakJika}`}
                                  value={s.ambang[u][j][m.kod]}
                                  onChange={(e) => setAmbang(u, j, m.kod, Number(e.target.value))}
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
                <Kumpulan tajuk={T.minRuangan}>
                  <Baris tajuk={T.minPerkataan} nota={T.minPerkataanNota}>
                    <input
                      type="number"
                      min={0}
                      className={inputNombor}
                      value={s.minRuangan.kata}
                      onChange={(e) => setS({ ...s, minRuangan: { ...s.minRuangan, kata: Number(e.target.value) } })}
                    />
                  </Baris>
                  <Baris tajuk={T.minAksara}>
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
              <Kumpulan tajuk={T.kumpPendua}>
                <Baris tajuk={T.hantarSemula} nota={T.hantarSemulaNota}>
                  {pilihMod(s.hantarSemulaSama, (m) => setS({ ...s, hantarSemulaSama: m }))}
                </Baris>
                <Baris tajuk={T.bukuSama} nota={T.bukuSamaNota}>
                  {pilihMod(s.bukuSamaBerulang, (m) => setS({ ...s, bukuSamaBerulang: m }))}
                </Baris>
                <Baris tajuk={T.rakanSekelas} nota={T.rakanSekelasNota}>
                  <select
                    className="input h-10 px-3 text-sm"
                    value={s.aktivitiKelas}
                    onChange={(e) => setS({ ...s, aktivitiKelas: e.target.value as "benar" | "kuning" })}
                  >
                    <option value="benar">{T.benarAktiviti}</option>
                    <option value="kuning">{T.mod.kuning}</option>
                  </select>
                </Baris>
              </Kumpulan>
              <Kumpulan tajuk={T.kumpBahasa}>
                <Baris tajuk={T.bercampur} nota={T.bercampurNota}>
                  {pilihMod(s.bahasaBercampur, (m) => setS({ ...s, bahasaBercampur: m }))}
                </Baris>
                <Baris tajuk={T.takSepadan} nota={T.takSepadanNota}>
                  <span className="flex sm:justify-end">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-ink"
                      checked={s.bahasaTakSepadan}
                      onChange={(e) => setS({ ...s, bahasaTakSepadan: e.target.checked })}
                    />
                  </span>
                </Baris>
                <Baris tajuk={T.tiadaUnsur} nota={T.tiadaUnsurNota}>
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
              <Kumpulan tajuk={T.kumpLain}>
                <Baris tajuk={T.ambangMurid} nota={T.ambangMuridNota}>
                  <input
                    type="number"
                    min={1}
                    className={inputNombor}
                    value={s.ambangMuridLuarBiasa}
                    onChange={(e) => setS({ ...s, ambangMuridLuarBiasa: Number(e.target.value) })}
                  />
                </Baris>
                <Baris tajuk={T.jeda} nota={T.jedaNota}>
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
              <p className="text-sm leading-relaxed text-graphite">{T.komenHuraian}</p>
              {[
                { tajuk: T.sebabMerah, warna: "merah" as const, senarai: KOMEN_MERAH },
                { tajuk: T.sebabKuning, warna: "kuning" as const, senarai: KOMEN_KUNING },
              ].map((kumpulan) => (
                <section key={kumpulan.tajuk} className="mt-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <TitikWarna warna={kumpulan.warna} className="h-2 w-2" />
                    {kumpulan.tajuk}
                  </h3>
                  <div className="mt-3 space-y-4">
                    {kumpulan.senarai.map((k) => (
                      <label key={k} className="block">
                        <span className="label">{kamus.sebab[k]}</span>
                        <textarea
                          className="textarea mt-1 text-sm"
                          rows={2}
                          value={s.komen[k] ?? kamus.komenLalai[k]}
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
            {T.reset}
          </button>
          <div className="flex gap-2">
            <button ref={batalRef} type="button" className="btn-outline-ink btn-sm" onClick={onTutup}>
              {kamus.umum.batal}
            </button>
            <button type="button" className="btn-ink btn-sm" onClick={() => onSimpan(s)}>
              {kamus.umum.simpan}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
