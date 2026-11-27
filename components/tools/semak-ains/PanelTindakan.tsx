"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Keputusan, KodSebab, RekodAins, Warna } from "@/lib/tools/semak-ains/jenis";
import { KOMEN_LALAI, LABEL_SEBAB, janaKomen } from "@/lib/tools/semak-ains/komen";
import type { Ringkasan } from "@/lib/tools/semak-ains/peraturan";
import type { Standard } from "@/lib/tools/semak-ains/standard";
import { pautanAins } from "./SenaraiRekod";
import { Ikon, KadKemajuan, TitikWarna } from "./Ui";
import type { HasilLaksana, KiraLaksana, StatusTindakan, Tindakan } from "./useSambunganAins";
import { WARNA_STATUS } from "./warna";

type Item = { id: string; komen: string };
type Dialog =
  | { jenis: "lulus"; senarai: Keputusan[]; contoh: Keputusan[] }
  | { jenis: "tolak"; senarai: Keputusan[] }
  | null;

type Props = {
  keputusan: Keputusan[];
  ringkasan: Ringkasan;
  rekodIkutId: Map<string, RekodAins>;
  status: Map<string, StatusTindakan>;
  dipilih: Set<string>;
  standard: Standard;
  labelTapisan: string;
  melaksana: boolean;
  kira: KiraLaksana;
  mengesahkan: { halaman: number; jumlahHalaman: number } | null;
  hasil: HasilLaksana | null;
  dilarang: boolean;
  /** Sebab tindakan dimatikan (dipapar di kaki kad apabila `dilarang`). */
  notaDilarang?: string;
  /** Kandungan tambahan di kaki kad ringkasan (cth. murid luar biasa). */
  kaki?: ReactNode;
  onLaksana: (tindakan: Tindakan, item: Item[]) => void;
  onHenti: () => void;
  onLihat: (warna: Warna) => void;
  onKosongkanPilihan: () => void;
};

function rawak<T>(arr: T[], n: number): T[] {
  const salin = [...arr];
  for (let i = salin.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = salin[i] as T;
    salin[i] = salin[j] as T;
    salin[j] = t;
  }
  return salin.slice(0, n);
}

function belumSiap(status: Map<string, StatusTindakan>, k: Keputusan): boolean {
  const st = status.get(k.id);
  return st?.berjaya !== true && st?.perluBacaSemula !== true;
}

const KETERANGAN: Record<Warna, string> = {
  hijau: "Memenuhi standard daerah. Semak rawak 5 rekod sebelum lulus pukal.",
  kuning: "Ada tanda yang perlu dilihat. Pilih rekod dalam senarai untuk lulus atau tolak.",
  merah: "Tidak memenuhi standard. Komen penolakan dijana mengikut sebab. Pilih rekod dalam senarai untuk meluluskannya jika anda dapati ia wajar.",
};

export default function PanelTindakan(p: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [ganti, setGanti] = useState<Partial<Record<KodSebab, string>>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const batalRef = useRef<HTMLButtonElement>(null);
  const tajukId = useId();
  const terbuka = dialog !== null;
  const { keputusan, status, dipilih, ringkasan } = p;

  const hijau = useMemo(
    () => keputusan.filter((k) => k.warna === "hijau" && belumSiap(status, k)),
    [keputusan, status],
  );
  const merah = useMemo(
    () => keputusan.filter((k) => k.warna === "merah" && belumSiap(status, k)),
    [keputusan, status],
  );
  const pilihAktif = useMemo(
    () => keputusan.filter((k) => dipilih.has(k.id) && belumSiap(status, k)),
    [keputusan, dipilih, status],
  );
  /* Rekod terpilih boleh diluluskan walaupun merah — GPM yang memutuskan (2026-11-27).
   * Lulus PUKAL kekal hijau sahaja ("Luluskan semua hijau"). */
  const pilihLulus = pilihAktif;
  const pilihTolak = useMemo(() => pilihAktif.filter((k) => k.warna !== "hijau"), [pilihAktif]);

  // Dialog asli: showModal() memberi latar inert, kurungan fokus & Escape.
  useEffect(() => {
    const el = dialogRef.current;
    if (!terbuka || !el) return;
    // Escape: pelayar hantar "cancel" lalu "close"; hanya tutup state bila dialog benar-benar tertutup.
    const onClose = () => {
      if (!el.open) setDialog(null);
    };
    el.addEventListener("close", onClose);
    if (!el.open) el.showModal();
    batalRef.current?.focus();
    return () => {
      el.removeEventListener("close", onClose);
      if (el.open) el.close();
    };
  }, [terbuka]);

  const bukaLulus = (senarai: Keputusan[]) => setDialog({ jenis: "lulus", senarai, contoh: rawak(senarai, 5) });
  const bukaTolak = (senarai: Keputusan[]) => {
    setGanti({});
    setDialog({ jenis: "tolak", senarai });
  };
  const sebabTolak = (senarai: Keputusan[]) => [
    ...new Set(senarai.flatMap((k) => (k.merah.length ? k.merah : k.kuning))),
  ];

  const komenSemasa = (kod: KodSebab) => ganti[kod] ?? p.standard.komen[kod] ?? KOMEN_LALAI[kod];
  const adaKomenKosong =
    dialog?.jenis === "tolak" && sebabTolak(dialog.senarai).some((kod) => komenSemasa(kod).trim() === "");

  const sahkan = () => {
    if (!dialog) return;
    if (dialog.jenis === "lulus") {
      p.onLaksana("approved", dialog.senarai.map((k) => ({ id: k.id, komen: "" })));
    } else {
      p.onLaksana(
        "rejected",
        dialog.senarai.map((k) => ({ id: k.id, komen: janaKomen(k.merah, k.kuning, p.standard, ganti) })),
      );
    }
    setDialog(null);
  };

  const pct = (n: number) => (ringkasan.jumlah ? Math.round((n / ringkasan.jumlah) * 100) : 0);
  const nombor = (n: number) => n.toLocaleString("ms-MY");

  const butangLajur = (w: Warna): ReactNode => {
    if (w === "hijau") {
      return (
        <button
          type="button"
          className="btn-primary w-full"
          disabled={p.dilarang || hijau.length === 0}
          onClick={() => bukaLulus(hijau)}
        >
          {hijau.length ? `Luluskan semua (${nombor(hijau.length)})` : "Tiada untuk diluluskan"}
        </button>
      );
    }
    if (w === "merah") {
      return (
        <button
          type="button"
          className="btn-ink w-full"
          disabled={p.dilarang || merah.length === 0}
          onClick={() => bukaTolak(merah)}
        >
          {merah.length ? `Tolak semua (${nombor(merah.length)})` : "Tiada untuk ditolak"}
        </button>
      );
    }
    return (
      <button type="button" className="btn-outline-ink w-full" disabled={ringkasan.kuning === 0} onClick={() => p.onLihat("kuning")}>
        Semak senarai
      </button>
    );
  };

  const hasil = p.hasil;
  const tiadaDiproses = hasil ? hasil.berjaya + hasil.gagal === 0 : false;
  const hasilAmaran = !!hasil && (hasil.gagal > 0 || tiadaDiproses);
  const namaTindakan = hasil?.tindakan === "approved" ? "Kelulusan" : "Penolakan";

  return (
    <>
      {p.melaksana ? (
        <KadKemajuan
          tajuk="Sedang dilaksanakan dalam AINS…"
          keterangan={
            p.mengesahkan
              ? p.mengesahkan.jumlahHalaman
                ? `Mengesahkan keputusan dalam AINS — halaman ${p.mengesahkan.halaman} / ${p.mengesahkan.jumlahHalaman}`
                : "Mengesahkan keputusan dalam AINS…"
              : `Diproses ${nombor(p.kira.diproses)} / ${nombor(p.kira.jumlah)} · berjaya ${nombor(p.kira.berjaya)} · gagal ${nombor(p.kira.gagal)}`
          }
          peratus={p.kira.jumlah ? Math.round((p.kira.diproses / p.kira.jumlah) * 100) : 0}
          nota="Jangan tutup atau muat semula tetingkap ini sehingga selesai."
          onHenti={p.onHenti}
        />
      ) : (
        <section className="card overflow-hidden" aria-labelledby={`${tajukId}-ringkasan`}>
          {hasil ? (
            <div className="flex items-start gap-3 border-b border-fog bg-cloud px-5 py-4 text-sm sm:px-6" role="status">
              <Ikon
                nama={hasilAmaran ? "amaran" : "betul"}
                className={hasilAmaran ? "mt-0.5 h-5 w-5 text-bloom-deep" : "mt-0.5 h-5 w-5 text-ink"}
              />
              <div className="min-w-0 text-graphite">
                <p className="font-semibold text-ink">
                  {/* 0 diproses = arahan ditolak penanda (cth. sibuk, tiada ID sah) — jangan tulis "selesai". */}
                  {tiadaDiproses
                    ? `${namaTindakan} tidak dilaksanakan — tiada rekod diproses.`
                    : `${namaTindakan} selesai — ${nombor(hasil.berjaya)} berjaya, ${nombor(hasil.gagal)} gagal${hasil.dihentikan ? " (dihentikan)" : ""}.`}
                </p>
                {hasil.ralat ? <p className="mt-0.5">{hasil.ralat}</p> : null}
                {hasil.masihMenunggu.length ? (
                  <p className="mt-0.5">
                    {nombor(hasil.masihMenunggu.length)} rekod masih &quot;Menunggu Pengesahan&quot; dalam AINS — semak
                    secara manual.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              <p id={`${tajukId}-ringkasan`} className="text-sm text-graphite">
                Rekod menunggu pengesahan
              </p>
              <p className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-ink">{nombor(ringkasan.jumlah)}</p>
            </div>
            <span className="status-badge">{p.labelTapisan}</span>
          </div>

          <div
            className="mx-5 mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-fog sm:mx-6"
            role="img"
            aria-label={`${WARNA_STATUS.hijau.label} ${pct(ringkasan.hijau)}%, ${WARNA_STATUS.kuning.label} ${pct(ringkasan.kuning)}%, ${WARNA_STATUS.merah.label} ${pct(ringkasan.merah)}%`}
          >
            {(["hijau", "kuning", "merah"] as const).map((w) =>
              ringkasan[w] ? (
                <span key={w} style={{ width: `${(ringkasan[w] / ringkasan.jumlah) * 100}%`, backgroundColor: WARNA_STATUS[w].warna }} />
              ) : null,
            )}
          </div>

          <div className="mt-5 grid divide-y divide-fog border-t border-fog sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {(["hijau", "kuning", "merah"] as const).map((w) => (
              <div key={w} className="flex flex-col gap-2 p-5 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: WARNA_STATUS[w].teks }}>
                    <TitikWarna warna={w} />
                    {WARNA_STATUS[w].label}
                  </p>
                  {w !== "kuning" && ringkasan[w] > 0 ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-graphite hover:text-ink hover:underline"
                      onClick={() => p.onLihat(w)}
                    >
                      Lihat
                    </button>
                  ) : null}
                </div>
                <p className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-ink">{nombor(ringkasan[w])}</span>
                  <span className="text-sm tabular-nums text-graphite">{pct(ringkasan[w])}%</span>
                </p>
                <p className="text-xs leading-relaxed text-graphite">{KETERANGAN[w]}</p>
                <div className="mt-auto pt-2">{butangLajur(w)}</div>
              </div>
            ))}
          </div>

          {p.dilarang ? (
            <p className="border-t border-fog px-5 py-3 text-sm text-graphite sm:px-6">
              {p.notaDilarang ?? "Tindakan dimatikan sehingga penanda dipasang semula."}
            </p>
          ) : null}
          {p.kaki}
        </section>
      )}

      {/* Portal ke body: .portal-page-enter ada transform, jadi `fixed` di dalamnya tidak melekat pada skrin. */}
      {!p.melaksana && !p.dilarang && pilihAktif.length > 0 && typeof document !== "undefined"
        ? createPortal(
        <div className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 lg:bottom-6">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-ink p-2 pl-3 text-white shadow-modal sm:gap-2 sm:pl-4">
            <span className="mr-1 whitespace-nowrap text-sm font-semibold tabular-nums">{nombor(pilihAktif.length)} dipilih</span>
            <button
              type="button"
              className="btn btn-sm px-3 bg-white text-ink sm:px-4 hover:bg-cloud disabled:bg-white/20 disabled:text-white/50"
              disabled={pilihLulus.length === 0}
              onClick={() => bukaLulus(pilihLulus)}
            >
              Luluskan ({nombor(pilihLulus.length)})
            </button>
            <button
              type="button"
              className="btn btn-sm px-3 border border-white/30 sm:px-4 text-white hover:bg-white/10 disabled:text-white/40"
              disabled={pilihTolak.length === 0}
              onClick={() => bukaTolak(pilihTolak)}
            >
              Tolak ({nombor(pilihTolak.length)})
            </button>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Kosongkan pilihan"
              title="Kosongkan pilihan"
              onClick={p.onKosongkanPilihan}
            >
              <Ikon nama="tutup" />
            </button>
          </div>
        </div>,
            document.body,
          )
        : null}

      {dialog ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={tajukId}
          className="!m-auto w-[calc(100%-2rem)] max-w-2xl border-0 bg-transparent p-0 backdrop:bg-black/40"
        >
          <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-modal">
            <header className="border-b border-fog px-6 py-5">
              <h2 id={tajukId} className="text-lg font-semibold text-ink">
                {dialog.jenis === "lulus"
                  ? `Luluskan ${nombor(dialog.senarai.length)} rekod?`
                  : `Tolak ${nombor(dialog.senarai.length)} rekod?`}
              </h2>
              <p className="mt-1 text-sm text-graphite">
                {dialog.jenis === "lulus"
                  ? "Semak rawak rekod di bawah sebelum meneruskan. Kelulusan dibuat atas nama akaun AINS anda."
                  : "Komen berikut dihantar kepada murid mengikut sebab. Anda boleh menyuntingnya."}
              </p>
              {dialog.jenis === "lulus" && dialog.senarai.some((k) => k.warna === "kuning") ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-charcoal">
                  <TitikWarna warna="kuning" className="h-2 w-2" />
                  {nombor(dialog.senarai.filter((k) => k.warna === "kuning").length)} rekod &quot;
                  {WARNA_STATUS.kuning.label}&quot; termasuk dalam pilihan ini.
                </p>
              ) : null}
              {dialog.jenis === "lulus" && dialog.senarai.some((k) => k.warna === "merah") ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-charcoal">
                  <TitikWarna warna="merah" className="h-2 w-2" />
                  {nombor(dialog.senarai.filter((k) => k.warna === "merah").length)} rekod &quot;
                  {WARNA_STATUS.merah.label}&quot; akan diluluskan atas keputusan anda.
                </p>
              ) : null}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {dialog.jenis === "lulus" ? (
                <ul className="space-y-3">
                  {dialog.contoh.map((k) => {
                    const r = p.rekodIkutId.get(k.id);
                    return r ? (
                      <li key={k.id} className="rounded-lg border border-fog p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">{r.tajuk}</p>
                            <p className="text-xs text-graphite">
                              {r.murid} · {r.kelas}
                            </p>
                          </div>
                          <a
                            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-charcoal hover:bg-cloud hover:text-ink"
                            href={pautanAins(k.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Buka dalam AINS
                            <Ikon nama="luar" className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        <p className="mt-2 line-clamp-3 border-l-2 border-fog pl-3 leading-relaxed text-charcoal">{r.rumusan}</p>
                      </li>
                    ) : null;
                  })}
                </ul>
              ) : (
                <div className="space-y-4">
                  {sebabTolak(dialog.senarai).map((kod) => (
                    <label key={kod} className="block">
                      <span className="label">{LABEL_SEBAB[kod]}</span>
                      <textarea
                        className="textarea mt-1"
                        rows={2}
                        value={komenSemasa(kod)}
                        onChange={(e) => setGanti((g) => ({ ...g, [kod]: e.target.value }))}
                      />
                      {komenSemasa(kod).trim() === "" ? (
                        <span className="mt-1 block text-xs text-bloom-deep">Komen tidak boleh kosong.</span>
                      ) : null}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <footer className="flex flex-wrap justify-end gap-2 border-t border-fog bg-cloud/50 px-6 py-4">
              <button ref={batalRef} type="button" className="btn-outline-ink" onClick={() => setDialog(null)}>
                Batal
              </button>
              <button
                type="button"
                className={dialog.jenis === "lulus" ? "btn-primary" : "btn-ink"}
                disabled={adaKomenKosong}
                onClick={sahkan}
              >
                {dialog.jenis === "lulus" ? "Teruskan lulus" : "Teruskan tolak"}
              </button>
            </footer>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
