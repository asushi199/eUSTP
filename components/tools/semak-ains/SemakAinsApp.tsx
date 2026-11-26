"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { janaCsv } from "@/lib/tools/semak-ains/csv";
import type { KodSebab } from "@/lib/tools/semak-ains/jenis";
import { KOMEN_LALAI } from "@/lib/tools/semak-ains/komen";
import { hantarLog } from "@/lib/tools/semak-ains/log-klien";
import { normalTeks } from "@/lib/tools/semak-ains/normal";
import { ringkaskan, semak } from "@/lib/tools/semak-ains/peraturan";
import { gabungStandard, tetapanBeza, type Standard, type TetapanGpm } from "@/lib/tools/semak-ains/standard";
import { bacaTetapan, padamTetapan, simpanTetapan } from "@/lib/tools/semak-ains/storan";
import { VERSI_ENJIN, VERSI_PENANDA_MIN } from "@/lib/tools/semak-ains/versi";
import LaciTetapan from "./LaciTetapan";
import PanelTapisan from "./PanelTapisan";
import PanelTindakan from "./PanelTindakan";
import RingkasanWarna from "./RingkasanWarna";
import SenaraiRekod from "./SenaraiRekod";
import { useSambunganAins } from "./useSambunganAins";

export default function SemakAinsApp() {
  const s = useSambunganAins();
  const kunci = s.sekolah ? (s.sekolah.kod ?? normalTeks(s.sekolah.nama)) : "umum";
  const [tetapan, setTetapan] = useState<TetapanGpm | null>(null);
  const [bukaTetapan, setBukaTetapan] = useState(false);
  const [dipilih, setDipilih] = useState<Set<string>>(() => new Set());
  const [dilihat, setDilihat] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setTetapan(bacaTetapan(kunci));
  }, [kunci]);
  useEffect(() => {
    setDipilih(new Set());
    setDilihat(new Set());
  }, [s.bacaanKe]);

  const standard = useMemo(() => gabungStandard(tetapan), [tetapan]);
  const diubah = useMemo(() => Object.keys(tetapanBeza(standard)).length > 0, [standard]);
  const adaKeputusan = s.fasa === "keputusan" || s.fasa === "melaksana";
  const keputusan = useMemo(() => (adaKeputusan ? semak(s.rekod, standard) : []), [adaKeputusan, s.rekod, standard]);
  const ringkasan = useMemo(() => ringkaskan(keputusan), [keputusan]);
  const rekodIkutId = useMemo(() => new Map(s.rekod.map((r) => [r.id, r])), [s.rekod]);
  const penandaLama = !!s.sekolah && s.sekolah.versiPenanda < VERSI_PENANDA_MIN;
  const muridLuarBiasa = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of s.rekod) {
      const k = `${r.murid}|${r.kelas}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].filter(([, n]) => n > standard.ambangMuridLuarBiasa).sort((a, b) => b[1] - a[1]);
  }, [s.rekod, standard.ambangMuridLuarBiasa]);

  const dilogBacaan = useRef(0);
  useEffect(() => {
    if (!s.sekolah || s.bacaanKe === 0 || dilogBacaan.current === s.bacaanKe || keputusan.length === 0) return;
    dilogBacaan.current = s.bacaanKe;
    hantarLog(
      {
        namaSekolah: s.sekolah.nama,
        kodSekolah: s.sekolah.kod,
        jenis: "semak",
        bilRekod: ringkasan.jumlah,
        bilHijau: ringkasan.hijau,
        bilKuning: ringkasan.kuning,
        bilMerah: ringkasan.merah,
        versiPenanda: s.sekolah.versiPenanda,
      },
      standard,
    );
  }, [s.bacaanKe, s.sekolah, keputusan.length, ringkasan, standard]);

  const dilogLaksana = useRef<object | null>(null);
  useEffect(() => {
    const h = s.hasilLaksana;
    if (!h || !s.sekolah || dilogLaksana.current === h || h.berjaya + h.gagal === 0) return;
    dilogLaksana.current = h;
    hantarLog(
      {
        namaSekolah: s.sekolah.nama,
        kodSekolah: s.sekolah.kod,
        jenis: h.tindakan === "approved" ? "lulus" : "tolak",
        bilRekod: h.berjaya + h.gagal,
        bilBerjaya: h.berjaya,
        bilGagal: h.gagal,
        versiPenanda: s.sekolah.versiPenanda,
      },
      standard,
    );
  }, [s.hasilLaksana, s.sekolah, standard]);

  const simpan = (baru: Standard) => {
    const komen = Object.fromEntries(
      Object.entries(baru.komen).filter(([k, v]) => v && v.trim() !== KOMEN_LALAI[k as KodSebab]),
    );
    const t = tetapanBeza(gabungStandard(tetapanBeza({ ...baru, komen })));
    simpanTetapan(kunci, t);
    setTetapan(t);
    setBukaTetapan(false);
  };
  const reset = () => {
    padamTetapan(kunci);
    setTetapan(null);
    setBukaTetapan(false);
  };

  const muatCsv = () => {
    const baris = keputusan.flatMap((k) => {
      const r = rekodIkutId.get(k.id);
      if (!r) return [];
      const st = s.status.get(k.id);
      return [
        {
          rekod: r,
          keputusan: k,
          tindakan: st ? (st.tindakan === "approved" ? "lulus" : "tolak") : "",
          hasil: st ? (st.berjaya ? "berjaya" : `gagal: ${st.jawapan ?? ""}`) : "",
          masa: st?.masa ?? "",
        },
      ];
    });
    const csv = janaCsv(baris, `${VERSI_ENJIN}${diubah ? " (tetapan diubah)" : ""}`);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `semak-ains-${s.sekolah?.kod ?? "sekolah"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const togol = (set: (f: (x: Set<string>) => Set<string>) => void) => (id: string) =>
    set((x) => {
      const y = new Set(x);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });
  const tanda = (id: string) => setDilihat((x) => new Set(x).add(id));

  if (s.fasa === "semak-sambungan") return <p className="mt-8 text-sm text-graphite">Memuatkan…</p>;

  if (s.fasa === "tiada-penanda") {
    return (
      <section className="card mt-8 p-6">
        <h2 className="text-lg font-semibold text-ink">Buka halaman ini melalui penanda AINS</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-graphite">
          <li>Pasang penanda &quot;Semak AINS&quot; pada bar penanda pelayar (sekali sahaja).</li>
          <li>Log masuk AINS sebagai guru dan buka Papan Pemuka.</li>
          <li>Klik penanda &quot;Semak AINS&quot; — halaman ini akan dibuka secara automatik.</li>
        </ol>
        <Link href="/tools/semak-ains/pasang" className="btn-primary mt-6 inline-flex">
          Cara pasang penanda
        </Link>
      </section>
    );
  }

  if (s.fasa === "menunggu") {
    return (
      <section className="card mt-8 p-6 text-sm text-graphite">
        Menyambung ke tab AINS… Jika tiada respons, klik penanda &quot;Semak AINS&quot; sekali lagi dalam tab AINS.
      </section>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="label">Sekolah</p>
          <p className="font-semibold text-ink">{s.sekolah?.nama}</p>
          {s.sekolah?.kod ? <p className="text-xs text-graphite">{s.sekolah.kod}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {diubah ? <span className="status-badge">Tetapan diubah</span> : null}
          <button type="button" className="btn-outline-ink" onClick={() => setBukaTetapan(true)}>
            Tetapan
          </button>
        </div>
      </div>

      {penandaLama ? (
        <div className="card p-4 text-sm text-ink">
          Penanda anda versi lama.{" "}
          <Link href="/tools/semak-ains/pasang" className="underline">
            Pasang semula
          </Link>{" "}
          sebelum meluluskan atau menolak rekod.
        </div>
      ) : null}

      {s.fasa === "sedia" ? <PanelTapisan onMula={s.mula} /> : null}

      {s.fasa === "membaca" ? (
        <section className="card p-6">
          <p className="font-semibold text-ink">Membaca rekod daripada AINS…</p>
          <p className="mt-1 text-sm text-graphite">
            Halaman {s.bacaan.halaman} / {s.bacaan.jumlahHalaman || "?"} · {s.rekod.length.toLocaleString("ms-MY")} rekod
          </p>
          <div className="mt-3 h-2 rounded bg-cloud">
            <div
              className="h-2 rounded bg-ink"
              style={{ width: `${s.bacaan.jumlahHalaman ? Math.round((s.bacaan.halaman / s.bacaan.jumlahHalaman) * 100) : 0}%` }}
            />
          </div>
          <button type="button" className="btn-outline-ink mt-4" onClick={s.henti}>
            Henti
          </button>
        </section>
      ) : null}

      {adaKeputusan ? (
        <>
          {s.ralatSambungan ? <div className="card p-4 text-sm text-ink">{s.ralatSambungan}</div> : null}
          {s.ralat ? <div className="card p-4 text-sm text-ink">{s.ralat}</div> : null}
          {s.halamanGagal.length ? (
            <div className="card p-4 text-sm text-ink">
              Halaman tidak dapat dibaca: {s.halamanGagal.join(", ")}. Rekod pada halaman ini tidak disemak.
            </div>
          ) : null}
          <RingkasanWarna ringkasan={ringkasan} />
          {muridLuarBiasa.length ? (
            <section className="card p-4 text-sm">
              <p className="font-semibold text-ink">
                Murid dengan rekod luar biasa banyak (lebih {standard.ambangMuridLuarBiasa} rekod)
              </p>
              <p className="mt-1 text-graphite">{muridLuarBiasa
                  .map(([k, n]) => {
                    const [nama, kelas] = k.split("|");
                    return `${nama} (${kelas}) — ${n}`;
                  })
                  .join(" · ")}</p>
              <p className="mt-1 text-xs text-graphite">
                Cadangan: semak rawak rekod murid ini sebelum meluluskan secara pukal.
              </p>
            </section>
          ) : null}
          <PanelTindakan
            keputusan={keputusan}
            rekodIkutId={rekodIkutId}
            status={s.status}
            dipilih={dipilih}
            standard={standard}
            melaksana={s.fasa === "melaksana"}
            kira={s.kira}
            mengesahkan={s.mengesahkan}
            hasil={s.hasilLaksana}
            dilarang={penandaLama}
            onLaksana={(tindakan, item) => s.laksana(tindakan, item, standard.jedaMs)}
            onHenti={s.henti}
            onCsv={muatCsv}
            onBacaSemula={s.bacaSemula}
          />
          <SenaraiRekod
            rekodIkutId={rekodIkutId}
            keputusan={keputusan}
            status={s.status}
            dipilih={dipilih}
            onTogolPilih={togol(setDipilih)}
            dilihat={dilihat}
            onTandaDilihat={tanda}
          />
        </>
      ) : null}

      {bukaTetapan ? (
        <LaciTetapan standard={standard} diubah={diubah} onSimpan={simpan} onReset={reset} onTutup={() => setBukaTetapan(false)} />
      ) : null}
    </div>
  );
}
