"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { janaCsv } from "@/lib/tools/semak-ains/csv";
import type { KodSebab, Warna } from "@/lib/tools/semak-ains/jenis";
import { terjemahRalatPenanda } from "@/lib/tools/semak-ains/i18n";
import { hantarLog } from "@/lib/tools/semak-ains/log-klien";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import { normalTeks } from "@/lib/tools/semak-ains/normal";
import { ringkaskan, semak } from "@/lib/tools/semak-ains/peraturan";
import { gabungStandard, tetapanBeza, type Standard, type TetapanGpm } from "@/lib/tools/semak-ains/standard";
import { bacaTetapan, padamTetapan, simpanTetapan } from "@/lib/tools/semak-ains/storan";
import { VERSI_ENJIN, VERSI_PENANDA_MIN } from "@/lib/tools/semak-ains/versi";
import { PemilihBahasa, PenyediaBahasa, useBahasa } from "./Bahasa";
import DialogTerputus from "./DialogTerputus";
import LaciTetapan from "./LaciTetapan";
import PanelTapisan, { labelTapisan } from "./PanelTapisan";
import PanelTindakan from "./PanelTindakan";
import Pengenalan from "./Pengenalan";
import SenaraiRekod, { PENAPIS_KOSONG, type Penapis } from "./SenaraiRekod";
import { Ikon, KadKemajuan, Notis } from "./Ui";
import { useSambunganAins } from "./useSambunganAins";

export type Sambungan = ReturnType<typeof useSambunganAins>;

export default function SemakAinsApp() {
  return (
    <PenyediaBahasa>
      <Bersambung />
    </PenyediaBahasa>
  );
}

/* Di dalam penyedia bahasa supaya mesej sambungan (useSambunganAins) mengikut bahasa paparan. */
function Bersambung() {
  const s = useSambunganAins();
  return <Paparan s={s} />;
}

/**
 * Paparan penuh alat (dipisahkan daripada hook sambungan supaya boleh dipratonton
 * dengan data sintetik di /dev/semak-ains). `tanpaLog` = jangan POST log bilangan.
 */
export function SemakAinsPaparan(p: { s: Sambungan; tanpaLog?: boolean }) {
  return (
    <PenyediaBahasa>
      <Paparan {...p} />
    </PenyediaBahasa>
  );
}

function Paparan(p: { s: Sambungan; tanpaLog?: boolean }) {
  return (
    <>
      <div className="-mb-3 mt-6 flex justify-end">
        <PemilihBahasa />
      </div>
      <Isi {...p} />
    </>
  );
}

function Isi({ s, tanpaLog = false }: { s: Sambungan; tanpaLog?: boolean }) {
  const { k } = useBahasa();
  const kunci = s.sekolah ? (s.sekolah.kod ?? normalTeks(s.sekolah.nama)) : "umum";
  const [tetapan, setTetapan] = useState<TetapanGpm | null>(null);
  const [bukaTetapan, setBukaTetapan] = useState(false);
  const [dipilih, setDipilih] = useState<Set<string>>(() => new Set());
  const [penapis, setPenapis] = useState<Penapis>(PENAPIS_KOSONG);

  useEffect(() => {
    setTetapan(bacaTetapan(kunci));
  }, [kunci]);
  useEffect(() => {
    setDipilih(new Set());
    setPenapis(PENAPIS_KOSONG);
  }, [s.bacaanKe]);

  const standard = useMemo(() => gabungStandard(tetapan), [tetapan]);
  const diubah = useMemo(() => Object.keys(tetapanBeza(standard)).length > 0, [standard]);
  const adaKeputusan = s.fasa === "keputusan" || s.fasa === "melaksana";
  const melaksana = s.fasa === "melaksana";
  const keputusan = useMemo(() => (adaKeputusan ? semak(s.rekod, standard) : []), [adaKeputusan, s.rekod, standard]);
  const ringkasan = useMemo(() => ringkaskan(keputusan), [keputusan]);
  const rekodIkutId = useMemo(() => new Map(s.rekod.map((r) => [r.id, r])), [s.rekod]);
  const penandaLama = !!s.sekolah && s.sekolah.versiPenanda < VERSI_PENANDA_MIN;
  /* Hanya bermakna semasa melahu; membaca/melaksana ada had masa sendiri. */
  const terputus = s.terputus && (s.fasa === "sedia" || s.fasa === "keputusan");
  /* Pop-up muncul setiap kali sambungan terputus; "Faham" menutupnya (notis sebaris kekal). */
  const [terputusDitutup, setTerputusDitutup] = useState(false);
  useEffect(() => {
    if (!terputus) setTerputusDitutup(false);
  }, [terputus]);
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
    if (tanpaLog || !s.sekolah || s.bacaanKe === 0 || dilogBacaan.current === s.bacaanKe || keputusan.length === 0) return;
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
  }, [tanpaLog, s.bacaanKe, s.sekolah, keputusan.length, ringkasan, standard]);

  const dilogLaksana = useRef<object | null>(null);
  useEffect(() => {
    const h = s.hasilLaksana;
    if (tanpaLog || !h || !s.sekolah || dilogLaksana.current === h || h.berjaya + h.gagal === 0) return;
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
  }, [tanpaLog, s.hasilLaksana, s.sekolah, standard]);

  const simpan = (baru: Standard) => {
    const komen = Object.fromEntries(
      Object.entries(baru.komen).filter(([kod, v]) => v && v.trim() !== k.komenLalai[kod as KodSebab]),
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
    const baris = keputusan.flatMap((kp) => {
      const r = rekodIkutId.get(kp.id);
      if (!r) return [];
      const st = s.status.get(kp.id);
      return [
        {
          rekod: r,
          keputusan: kp,
          tindakan: st ? (st.tindakan === "approved" ? "lulus" : "tolak") : "",
          hasil: st ? (st.berjaya ? "berjaya" : `gagal: ${st.jawapan ?? ""}`) : "",
          masa: st?.masa ?? "",
        },
      ];
    });
    const csv = janaCsv(baris, `${VERSI_ENJIN}${diubah ? ` (${k.app.tetapanDiubahCsv})` : ""}`, k.sebab);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `semak-ains-${s.sekolah?.kod ?? "sekolah"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const togolPilih = (id: string) =>
    setDipilih((x) => {
      const y = new Set(x);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });

  const pilihBanyak = (id: string[], pilih: boolean) =>
    setDipilih((x) => {
      const y = new Set(x);
      for (const i of id) {
        if (pilih) y.add(i);
        else y.delete(i);
      }
      return y;
    });

  const keSenarai = (p: Penapis) => {
    setPenapis(p);
    window.requestAnimationFrame(() =>
      document.getElementById("senarai-rekod")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };
  const lihatWarna = (warna: Warna) => keSenarai({ ...PENAPIS_KOSONG, warna });

  if (s.fasa === "semak-sambungan") {
    return <div className="mt-8 h-48 animate-pulse rounded-xl bg-white/70" aria-label={k.umum.memuatkan} />;
  }

  if (s.fasa === "tiada-penanda") return <Pengenalan />;

  if (s.fasa === "menunggu") {
    return (
      <section className="card mt-8 flex items-center gap-4 p-6 sm:p-8" aria-live="polite">
        <span className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-fog border-t-ink" aria-hidden />
        <div>
          <p className="font-semibold text-ink">{k.app.menyambung}</p>
          <p className="mt-0.5 text-sm text-graphite">{k.app.menyambungNota(NAMA_PENANDA)}</p>
        </div>
      </section>
    );
  }

  const adaPilihan = keputusan.some((kp) => dipilih.has(kp.id));
  const kosong = s.fasa === "keputusan" && ringkasan.jumlah === 0;
  const subtajuk = [s.sekolah?.kod, adaKeputusan || s.fasa === "membaca" ? labelTapisan(s.tapisan, k) : null]
    .filter(Boolean)
    .join(" · ");

  const kakiMurid = muridLuarBiasa.length ? (
    <details className="group border-t border-fog px-5 py-3.5 text-sm sm:px-6">
      <summary className="flex cursor-pointer list-none items-start gap-2.5 text-charcoal [&::-webkit-details-marker]:hidden">
        <Ikon nama="info" className="mt-0.5 text-graphite" />
        <span className="min-w-0 flex-1">{k.app.luarBiasa(muridLuarBiasa.length, standard.ambangMuridLuarBiasa)}</span>
        <span className="shrink-0 text-xs font-medium text-graphite group-open:hidden">{k.umum.lihat}</span>
        <span className="hidden shrink-0 text-xs font-medium text-graphite group-open:inline">{k.umum.tutup}</span>
      </summary>
      <div className="mt-3 flex flex-wrap gap-2 pl-6">
        {muridLuarBiasa.map(([kunciMurid, n]) => {
          const [nama = "", kelas = ""] = kunciMurid.split("|");
          return (
            <button
              key={kunciMurid}
              type="button"
              className="status-badge hover:border-steel"
              title={k.app.tapisMurid}
              onClick={() => keSenarai({ ...PENAPIS_KOSONG, cari: nama })}
            >
              {nama} · {kelas}
              <b className="font-semibold tabular-nums text-ink">{n}</b>
            </button>
          );
        })}
      </div>
    </details>
  ) : null;

  return (
    <div className={cn("mt-8 space-y-5", adaPilihan && "pb-24")}>
      <section className="card flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cloud text-ink">
            <Ikon nama="sekolah" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{s.sekolah?.nama ?? k.umum.sekolah}</p>
            {subtajuk ? <p className="text-xs text-graphite">{subtajuk}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {adaKeputusan ? (
            <>
              <button type="button" className="btn-outline-ink btn-sm" disabled={melaksana} onClick={s.tukarTapisan}>
                <Ikon nama="tukar" />
                {k.app.tukar}
              </button>
              <button type="button" className="btn-outline-ink btn-sm" disabled={melaksana || terputus} onClick={s.bacaSemula}>
                <Ikon nama="ulang" />
                {k.app.bacaSemula}
              </button>
              <button
                type="button"
                className="btn-outline-ink btn-sm"
                disabled={melaksana || keputusan.length === 0}
                onClick={muatCsv}
                title={k.app.csvPetua}
              >
                <Ikon nama="muat" />
                CSV
              </button>
            </>
          ) : null}
          <button type="button" className="btn-outline-ink btn-sm" onClick={() => setBukaTetapan(true)}>
            <Ikon nama="tetapan" />
            {k.app.tetapan}
            {diubah ? (
              <span className="rounded-full bg-ink px-1.5 py-px text-[10px] font-semibold normal-case tracking-normal text-white">
                {k.app.diubah}
              </span>
            ) : null}
          </button>
        </div>
      </section>

      {terputus ? (
        <Notis tajuk={k.app.terputusTajuk}>{k.app.terputusIsi(NAMA_PENANDA)}</Notis>
      ) : null}

      {penandaLama ? (
        <Notis tajuk={k.app.lamaTajuk}>
          {k.app.lamaSebelum(NAMA_PENANDA)}
          {/* Tab baharu tanpa opener → paparan pasang penanda; sambungan tab ini kekal. */}
          <a href="/tools/semak-ains" target="_blank" rel="noopener" className="font-medium text-ink underline">
            {k.app.lamaPautan}
          </a>
          {k.app.lamaSelepas}
        </Notis>
      ) : null}

      {s.fasa === "sedia" ? (
        <PanelTapisan
          onMula={s.mula}
          awal={s.tapisan}
          onBatal={s.bacaanKe > 0 ? s.kembaliKeputusan : undefined}
          dimatikan={terputus}
        />
      ) : null}

      {s.fasa === "membaca" ? (
        <KadKemajuan
          tajuk={k.app.membaca}
          keterangan={k.app.membacaKeterangan(
            s.bacaan.halaman.toLocaleString("ms-MY"),
            s.bacaan.jumlahHalaman ? s.bacaan.jumlahHalaman.toLocaleString("ms-MY") : "?",
            s.rekod.length.toLocaleString("ms-MY"),
          )}
          peratus={s.bacaan.jumlahHalaman ? Math.round((s.bacaan.halaman / s.bacaan.jumlahHalaman) * 100) : null}
          nota={k.app.janganTutupBaca}
          labelHenti={k.umum.henti}
          onHenti={s.henti}
        />
      ) : null}

      {adaKeputusan ? (
        <>
          {s.ralatSambungan && !terputus ? <Notis tajuk={k.app.terputusTajuk}>{s.ralatSambungan}</Notis> : null}
          {s.ralat ? <Notis tajuk={k.app.bacaanTakLengkap}>{terjemahRalatPenanda(s.ralat, k)}</Notis> : null}
          {s.halamanGagal.length ? (
            <Notis tajuk={k.app.halamanGagalTajuk(s.halamanGagal.length)}>
              {k.app.halamanGagalIsi(s.halamanGagal.join(", "))}
            </Notis>
          ) : null}

          {kosong ? (
            <section className="card px-6 py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-cloud text-ink">
                <Ikon nama="betul" className="h-6 w-6" />
              </span>
              <p className="mt-4 text-lg font-semibold text-ink">{k.app.kosongTajuk}</p>
              <p className="mt-1 text-sm text-graphite">
                {s.tapisan.tahun || s.tapisan.kelas
                  ? k.app.kosongTapisan(labelTapisan(s.tapisan, k))
                  : k.app.kosongSemua}
              </p>
              <button type="button" className="btn-outline-ink mt-6" onClick={s.tukarTapisan}>
                {k.app.tukar}
              </button>
            </section>
          ) : (
            <>
              <PanelTindakan
                keputusan={keputusan}
                ringkasan={ringkasan}
                rekodIkutId={rekodIkutId}
                status={s.status}
                dipilih={dipilih}
                standard={standard}
                labelTapisan={labelTapisan(s.tapisan, k)}
                melaksana={melaksana}
                kira={s.kira}
                mengesahkan={s.mengesahkan}
                hasil={s.hasilLaksana}
                dilarang={penandaLama || terputus}
                notaDilarang={
                  terputus && !penandaLama
                    ? k.app.dimatikan(NAMA_PENANDA)
                    : undefined
                }
                kaki={kakiMurid}
                onLaksana={(tindakan, item) => s.laksana(tindakan, item, standard.jedaMs)}
                onHenti={s.henti}
                onLihat={lihatWarna}
                onKosongkanPilihan={() => setDipilih(new Set())}
              />
              <SenaraiRekod
                rekodIkutId={rekodIkutId}
                keputusan={keputusan}
                ringkasan={ringkasan}
                status={s.status}
                dipilih={dipilih}
                penapis={penapis}
                onPenapis={setPenapis}
                onTogolPilih={togolPilih}
                onPilihBanyak={pilihBanyak}
              />
            </>
          )}
        </>
      ) : null}

      {terputus && !terputusDitutup ? <DialogTerputus onTutup={() => setTerputusDitutup(true)} /> : null}

      {bukaTetapan ? (
        <LaciTetapan standard={standard} diubah={diubah} onSimpan={simpan} onReset={reset} onTutup={() => setBukaTetapan(false)} />
      ) : null}
    </div>
  );
}
