"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Keputusan, KodSebab, RekodAins } from "@/lib/tools/semak-ains/jenis";
import { KOMEN_LALAI, LABEL_SEBAB, janaKomen } from "@/lib/tools/semak-ains/komen";
import type { Standard } from "@/lib/tools/semak-ains/standard";
import { pautanAins } from "./SenaraiRekod";
import type { HasilLaksana, KiraLaksana, StatusTindakan, Tindakan } from "./useSambunganAins";

type Item = { id: string; komen: string };
type Dialog =
  | { jenis: "lulus"; senarai: Keputusan[]; contoh: Keputusan[] }
  | { jenis: "tolak"; senarai: Keputusan[] }
  | null;

type Props = {
  keputusan: Keputusan[];
  rekodIkutId: Map<string, RekodAins>;
  status: Map<string, StatusTindakan>;
  dipilih: Set<string>;
  standard: Standard;
  melaksana: boolean;
  kira: KiraLaksana;
  mengesahkan: { halaman: number; jumlahHalaman: number } | null;
  hasil: HasilLaksana | null;
  dilarang: boolean;
  onLaksana: (tindakan: Tindakan, item: Item[]) => void;
  onHenti: () => void;
  onCsv: () => void;
  onBacaSemula: () => void;
  onTukarTapisan: () => void;
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

export default function PanelTindakan(p: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [ganti, setGanti] = useState<Partial<Record<KodSebab, string>>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const batalRef = useRef<HTMLButtonElement>(null);
  const tajukId = useId();
  const terbuka = dialog !== null;
  const { keputusan, status, dipilih } = p;

  const hijau = useMemo(
    () => keputusan.filter((k) => k.warna === "hijau" && belumSiap(status, k)),
    [keputusan, status],
  );
  const merah = useMemo(
    () => keputusan.filter((k) => k.warna === "merah" && belumSiap(status, k)),
    [keputusan, status],
  );
  const pilihLulus = useMemo(
    () => keputusan.filter((k) => dipilih.has(k.id) && k.warna !== "merah" && belumSiap(status, k)),
    [keputusan, dipilih, status],
  );
  const pilihTolak = useMemo(
    () => keputusan.filter((k) => dipilih.has(k.id) && k.warna !== "hijau" && belumSiap(status, k)),
    [keputusan, dipilih, status],
  );

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

  if (p.melaksana) {
    const pct = p.kira.jumlah ? Math.round((p.kira.diproses / p.kira.jumlah) * 100) : 0;
    return (
      <section className="card p-6">
        <p className="font-semibold text-ink">Sedang dilaksanakan dalam tab AINS…</p>
        <p className="mt-1 text-sm text-graphite">
          {p.mengesahkan
            ? `Mengesahkan keputusan dalam AINS… halaman ${p.mengesahkan.halaman} / ${p.mengesahkan.jumlahHalaman || "…"}`
            : `Diproses ${p.kira.diproses} / ${p.kira.jumlah} · berjaya ${p.kira.berjaya} · gagal ${p.kira.gagal}`}
        </p>
        <div className="mt-3 h-2 rounded bg-cloud">
          <div className="h-2 rounded bg-ink" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-xs text-graphite">
          Jangan tutup tab AINS atau tab ini. Jika tetingkap pengesahan muncul dalam tab AINS, jawab di sana.
        </p>
        <button type="button" className="btn-outline-ink mt-4" onClick={p.onHenti}>
          Henti
        </button>
      </section>
    );
  }

  return (
    <section className="card p-4 sm:p-6">
      {p.hasil ? (
        <div className="mb-4 rounded border border-cloud p-3 text-sm">
          <p className="font-semibold text-ink">
            {p.hasil.tindakan === "approved" ? "Kelulusan" : "Penolakan"} selesai: {p.hasil.berjaya} berjaya,{" "}
            {p.hasil.gagal} gagal{p.hasil.dihentikan ? " (dihentikan)" : ""}.
          </p>
          {p.hasil.ralat ? <p className="mt-1 text-graphite">{p.hasil.ralat}</p> : null}
          {p.hasil.masihMenunggu.length ? (
            <p className="mt-1 text-graphite">
              {p.hasil.masihMenunggu.length} rekod masih &quot;Menunggu Pengesahan&quot; dalam AINS — semak secara manual.
            </p>
          ) : null}
        </div>
      ) : null}

      {p.dilarang ? (
        <p className="text-sm text-graphite">Tindakan dimatikan sehingga penanda dipasang semula.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" disabled={hijau.length === 0} onClick={() => bukaLulus(hijau)}>
            Luluskan semua hijau ({hijau.length})
          </button>
          <button type="button" className="btn-ink" disabled={merah.length === 0} onClick={() => bukaTolak(merah)}>
            Tolak semua merah ({merah.length})
          </button>
          <button type="button" className="btn-outline-ink" disabled={pilihLulus.length === 0} onClick={() => bukaLulus(pilihLulus)}>
            Luluskan terpilih ({pilihLulus.length})
          </button>
          <button type="button" className="btn-outline-ink" disabled={pilihTolak.length === 0} onClick={() => bukaTolak(pilihTolak)}>
            Tolak terpilih ({pilihTolak.length})
          </button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-outline-ink" onClick={p.onCsv}>
          Muat turun CSV
        </button>
        <button type="button" className="btn-outline-ink" onClick={p.onTukarTapisan}>
          Tukar tahun / kelas
        </button>
        <button type="button" className="btn-outline-ink" onClick={p.onBacaSemula}>
          Baca semula
        </button>
      </div>

      {dialog ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={tajukId}
          className="m-auto w-[calc(100%-2rem)] max-w-2xl border-0 bg-transparent p-0 backdrop:bg-black/40"
        >
          <div className="card max-h-[85vh] w-full overflow-y-auto bg-white p-6">
            {dialog.jenis === "lulus" ? (
              <>
                <h2 id={tajukId} className="text-lg font-semibold text-ink">Luluskan {dialog.senarai.length} rekod?</h2>
                <p className="mt-1 text-sm text-graphite">
                  Semak rawak 5 rekod di bawah sebelum meneruskan. Kelulusan dibuat atas nama akaun AINS anda.
                </p>
                <ul className="mt-4 space-y-3">
                  {dialog.contoh.map((k) => {
                    const r = p.rekodIkutId.get(k.id);
                    return r ? (
                      <li key={k.id} className="rounded border border-cloud p-3 text-sm">
                        <p className="font-semibold text-ink">{r.tajuk}</p>
                        <p className="text-xs text-graphite">
                          {r.murid} · {r.kelas}
                        </p>
                        <p className="mt-1 line-clamp-3 text-graphite">{r.rumusan}</p>
                        <a className="mt-1 inline-block text-ink underline" href={pautanAins(k.id)} target="_blank" rel="noopener noreferrer">
                          Buka dalam AINS
                        </a>
                      </li>
                    ) : null;
                  })}
                </ul>
              </>
            ) : (
              <>
                <h2 id={tajukId} className="text-lg font-semibold text-ink">Tolak {dialog.senarai.length} rekod?</h2>
                <p className="mt-1 text-sm text-graphite">
                  Komen berikut dihantar kepada murid mengikut sebab. Anda boleh menyuntingnya.
                </p>
                <div className="mt-4 space-y-4">
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
                        <span className="mt-1 block text-xs text-graphite">Komen tidak boleh kosong.</span>
                      ) : null}
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button ref={batalRef} type="button" className="btn-outline-ink" onClick={() => setDialog(null)}>
                Batal
              </button>
              <button type="button" className="btn-ink" disabled={adaKomenKosong} onClick={sahkan}>
                {dialog.jenis === "lulus" ? "Teruskan lulus" : "Teruskan tolak"}
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
