"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RekodAins } from "@/lib/tools/semak-ains/jenis";
import {
  ASAL_AINS,
  SUMBER,
  mesejAinsSah,
  type MesejKeAins,
  type TanpaSumber,
  type Tapisan,
} from "@/lib/tools/semak-ains/mesej";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import { bacaSesi, simpanSesi } from "@/lib/tools/semak-ains/storan";
import { VERSI_ENJIN } from "@/lib/tools/semak-ains/versi";
import { useBahasa } from "./Bahasa";

export type Fasa =
  | "semak-sambungan"
  | "tiada-penanda"
  | "menunggu"
  | "sedia"
  | "membaca"
  | "keputusan"
  | "melaksana";
export type InfoSekolah = { nama: string; kod: string | null; versiPenanda: number };
export type Tindakan = "approved" | "rejected";
export type StatusTindakan = {
  tindakan: Tindakan;
  berjaya: boolean;
  jawapan: string | null;
  masa: string;
  /** Rekod masih "menunggu" dalam AINS selepas tindakan: tidak boleh diambil tindakan sehingga dibaca semula. */
  perluBacaSemula?: boolean;
};
export type HasilLaksana = {
  tindakan: Tindakan;
  berjaya: number;
  gagal: number;
  masihMenunggu: string[];
  dihentikan: boolean;
  ralat: string | null;
};
const HAD_BACA_MS = 45_000;
const HAD_LAKSANA_MS = 90_000;
/** Respons pertama selepas arahan (halaman 1 / rekod pertama ~1 s). Tiada respons = tab AINS dimuat semula/ditutup. */
const HAD_RESPONS_PERTAMA_MS = 12_000;
/** Denyut semasa melahu: ping "sedia" → penanda membalas "sekolah". */
const SELANG_DENYUT_MS = 4_000;
const HAD_DENYUT_MS = 3_000;

export type KiraLaksana = { jumlah: number; diproses: number; berjaya: number; gagal: number };

/**
 * Tetingkap yang menjalankan penanda: induk (mod tetingkap, lalai sejak penanda v8 — halaman ini
 * dalam iframe tetingkap berasal AINS, /tools/semak-ains/tetingkap) atau pembuka (mod tab, penanda
 * v5–v7 — halaman ini dibuka oleh tab AINS). Mesej tetap disahkan dengan asal AINS, jadi induk
 * bukan AINS tidak boleh berbuat apa-apa.
 */
function rakanAins(): Window | null {
  if (window.opener) return window.opener as Window;
  return window.parent !== window ? window.parent : null;
}

/** Sambungan postMessage dengan penanda (lihat rakanAins). */
export function useSambunganAins() {
  /* Mesej sambungan mengikut bahasa paparan semasa (ref: kesan di bawah tidak perlu dipasang semula). */
  const { k: kamus } = useBahasa();
  const kamusRef = useRef(kamus);
  kamusRef.current = kamus;
  const [fasa, setFasa] = useState<Fasa>("semak-sambungan");
  const [sekolah, setSekolah] = useState<InfoSekolah | null>(null);
  const [rekod, setRekod] = useState<RekodAins[]>([]);
  const [bacaan, setBacaan] = useState({ halaman: 0, jumlahHalaman: 0 });
  const [bacaanKe, setBacaanKe] = useState(0);
  const [ralat, setRalat] = useState<string | null>(null);
  const [ralatSambungan, setRalatSambungan] = useState<string | null>(null);
  const [mengesahkan, setMengesahkan] = useState<{ halaman: number; jumlahHalaman: number } | null>(null);
  const [halamanGagal, setHalamanGagal] = useState<number[]>([]);
  const [status, setStatus] = useState<Map<string, StatusTindakan>>(() => new Map());
  const [kira, setKira] = useState<KiraLaksana>({ jumlah: 0, diproses: 0, berjaya: 0, gagal: 0 });
  const [hasilLaksana, setHasilLaksana] = useState<HasilLaksana | null>(null);
  const tindakanSemasa = useRef<Tindakan>("approved");
  const tapisanAkhir = useRef<Tapisan>({});
  const [tapisan, setTapisan] = useState<Tapisan>({});
  const fasaRef = useRef<Fasa>("semak-sambungan");
  const terakhirMesej = useRef(0);
  /** Ada mesej daripada penanda sejak arahan terakhir (mula/laksana) dihantar. */
  const adaRespons = useRef(false);
  /** Penanda tidak membalas denyut: tab AINS dimuat semula, dinavigasi atau ditutup. */
  const [terputus, setTerputus] = useState(false);
  const namaSekolahRef = useRef("");
  const mulaRef = useRef<(t: Tapisan) => void>(() => {});
  fasaRef.current = fasa;

  const hantar = useCallback((m: TanpaSumber<MesejKeAins>) => {
    rakanAins()?.postMessage({ ...m, sumber: SUMBER }, ASAL_AINS);
  }, []);

  useEffect(() => {
    const rakan = rakanAins();
    if (!rakan) {
      setFasa("tiada-penanda");
      return;
    }
    setFasa("menunggu");
    const dengar = (e: MessageEvent) => {
      if (e.origin !== ASAL_AINS || e.source !== rakan || !mesejAinsSah(e.data)) return;
      const d = e.data;
      terakhirMesej.current = Date.now();
      adaRespons.current = true;
      setTerputus(false);
      switch (d.jenis) {
        case "sekolah":
          namaSekolahRef.current = d.nama;
          /* Balasan denyut tiba setiap beberapa saat — kekalkan objek jika tiada perubahan. */
          setSekolah((lama) =>
            lama && lama.nama === d.nama && lama.kod === d.kod && lama.versiPenanda === d.versiPenanda
              ? lama
              : { nama: d.nama, kod: d.kod, versiPenanda: d.versiPenanda },
          );
          if (fasaRef.current === "menunggu") {
            /* Tab ini dimuat semula (atau penanda diklik semula): baca semula tapisan terakhir
             * secara automatik supaya GPM tidak perlu memilih dan menekan Mula baca lagi. */
            const sesi = bacaSesi(d.nama);
            if (sesi) mulaRef.current(sesi);
            else {
              fasaRef.current = "sedia";
              setFasa("sedia");
            }
          }
          break;
        case "rekod":
          setRalatSambungan(null);
          setRekod((lama) => {
            const ada = new Set(lama.map((r) => r.id));
            return [...lama, ...d.rekod.filter((r) => !ada.has(r.id))];
          });
          setBacaan({ halaman: d.halaman, jumlahHalaman: d.jumlahHalaman });
          break;
        case "selesai-baca":
          setRalat(d.ralat);
          setHalamanGagal(d.halamanGagal);
          setBacaanKe((n) => n + 1);
          setFasa("keputusan");
          break;
        case "mengesahkan":
          setMengesahkan({ halaman: d.halaman, jumlahHalaman: d.jumlahHalaman });
          break;
        case "kemajuan":
          setStatus((lama) =>
            new Map(lama).set(d.id, {
              tindakan: tindakanSemasa.current,
              berjaya: d.berjaya,
              jawapan: d.jawapan,
              masa: new Date().toISOString(),
            }),
          );
          setKira((k) => ({
            ...k,
            diproses: k.diproses + 1,
            berjaya: k.berjaya + (d.berjaya ? 1 : 0),
            gagal: k.gagal + (d.berjaya ? 0 : 1),
          }));
          break;
        case "selesai-laksana":
          setMengesahkan(null);
          if (d.masihMenunggu.length) {
            const menunggu = d.masihMenunggu;
            setStatus((lama) => {
              const baru = new Map(lama);
              for (const id of menunggu) {
                baru.set(id, {
                  tindakan: tindakanSemasa.current,
                  berjaya: false,
                  jawapan: kamusRef.current.sambungan.masihMenunggu,
                  masa: new Date().toISOString(),
                  perluBacaSemula: true,
                });
              }
              return baru;
            });
          }
          setHasilLaksana({
            tindakan: tindakanSemasa.current,
            berjaya: d.berjaya,
            gagal: d.gagal,
            masihMenunggu: d.masihMenunggu,
            dihentikan: d.dihentikan,
            ralat: d.ralat,
          });
          setFasa("keputusan");
          break;
      }
    };
    const hentiJikaSibuk = () => {
      if (fasaRef.current === "membaca" || fasaRef.current === "melaksana") {
        rakanAins()?.postMessage({ sumber: SUMBER, jenis: "henti" }, ASAL_AINS);
      }
    };
    window.addEventListener("message", dengar);
    window.addEventListener("pagehide", hentiJikaSibuk);
    rakan.postMessage({ sumber: SUMBER, jenis: "sedia", versiEnjin: VERSI_ENJIN }, ASAL_AINS);
    return () => {
      window.removeEventListener("message", dengar);
      window.removeEventListener("pagehide", hentiJikaSibuk);
      hentiJikaSibuk();
    };
  }, []);

  // Pengawas: jika tab AINS ditutup/dimuat semula semasa membaca/melaksana, henti menunggu.
  useEffect(() => {
    if (fasa !== "membaca" && fasa !== "melaksana") return;
    const id = window.setInterval(() => {
      const rakan = rakanAins();
      if (!rakan || rakan.closed) {
        setRalatSambungan(kamusRef.current.sambungan.tabDitutup);
        setFasa("keputusan");
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [fasa]);

  // Denyut semasa melahu: kesan tab AINS dimuat semula/ditutup SEBELUM GPM menekan sesuatu.
  useEffect(() => {
    if (fasa !== "sedia" && fasa !== "keputusan") return;
    let dihantarPada = 0;
    const denyut = () => {
      const rakan = rakanAins();
      if (!rakan || rakan.closed) {
        setTerputus(true);
        return;
      }
      if (dihantarPada && terakhirMesej.current < dihantarPada && Date.now() - dihantarPada > HAD_DENYUT_MS) {
        setTerputus(true);
      }
      dihantarPada = Date.now();
      rakan.postMessage({ sumber: SUMBER, jenis: "sedia", versiEnjin: VERSI_ENJIN }, ASAL_AINS);
    };
    denyut();
    const id = window.setInterval(denyut, SELANG_DENYUT_MS);
    return () => window.clearInterval(id);
  }, [fasa]);

  // Semasa membaca/melaksana: minta pengesahan pelayar sebelum tab ini dimuat semula/ditutup.
  useEffect(() => {
    if (fasa !== "membaca" && fasa !== "melaksana") return;
    const tahan = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", tahan);
    return () => window.removeEventListener("beforeunload", tahan);
  }, [fasa]);

  // Had masa tanpa respons: tab AINS mungkin tergantung, bertukar halaman atau ditutup tanpa isyarat.
  useEffect(() => {
    if (fasa !== "membaca" && fasa !== "melaksana") return;
    terakhirMesej.current = Date.now();
    const id = window.setInterval(() => {
      const senyap = Date.now() - terakhirMesej.current;
      let mesej: string | null = null;
      if (!adaRespons.current && senyap > HAD_RESPONS_PERTAMA_MS) {
        /* Tab AINS dimuat semula/dinavigasi = penanda hilang; window.opener masih wujud jadi
         * pengawas "closed" tidak mengesannya. */
        mesej = kamusRef.current.sambungan.tiadaRespons(NAMA_PENANDA);
        if (fasa === "melaksana") mesej += kamusRef.current.sambungan.semakDahulu;
      } else if (fasa === "membaca" && senyap > HAD_BACA_MS) {
        mesej = kamusRef.current.sambungan.tiadaResponsBaca;
      } else if (fasa === "melaksana" && senyap > HAD_LAKSANA_MS) {
        mesej = kamusRef.current.sambungan.tiadaResponsLaksana;
      }
      if (mesej) {
        setRalatSambungan(mesej);
        setFasa("keputusan");
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [fasa]);

  const mula = useCallback(
    (tapisan: Tapisan) => {
      tapisanAkhir.current = tapisan;
      setTapisan(tapisan);
      setRekod([]);
      setStatus(new Map());
      setHasilLaksana(null);
      setRalat(null);
      setRalatSambungan(null);
      setHalamanGagal([]);
      setBacaan({ halaman: 0, jumlahHalaman: 0 });
      adaRespons.current = false;
      fasaRef.current = "membaca";
      setFasa("membaca");
      simpanSesi(namaSekolahRef.current, tapisan);
      hantar({ jenis: "mula", tapisan });
    },
    [hantar],
  );
  mulaRef.current = mula;

  const bacaSemula = useCallback(() => mula(tapisanAkhir.current), [mula]);

  /** Kembali ke panel tapisan untuk membaca tahun/kelas lain (hanya selepas bacaan selesai). */
  const tukarTapisan = useCallback(() => setFasa((f) => (f === "keputusan" ? "sedia" : f)), []);

  /** Batal tukar tapisan: kembali ke keputusan bacaan terakhir (rekod masih dalam memori). */
  const kembaliKeputusan = useCallback(() => setFasa((f) => (f === "sedia" ? "keputusan" : f)), []);

  const laksana = useCallback(
    (tindakan: Tindakan, item: { id: string; komen: string }[], jedaMs: number) => {
      if (item.length === 0) return;
      tindakanSemasa.current = tindakan;
      setHasilLaksana(null);
      setKira({ jumlah: item.length, diproses: 0, berjaya: 0, gagal: 0 });
      setMengesahkan(null);
      setRalatSambungan(null);
      adaRespons.current = false;
      setFasa("melaksana");
      hantar({ jenis: "laksana", tindakan, item, jedaMs });
    },
    [hantar],
  );

  const henti = useCallback(() => hantar({ jenis: "henti" }), [hantar]);

  return {
    fasa,
    sekolah,
    rekod,
    bacaan,
    bacaanKe,
    ralat,
    ralatSambungan,
    terputus,
    mengesahkan,
    halamanGagal,
    status,
    kira,
    hasilLaksana,
    tapisan,
    mula,
    bacaSemula,
    tukarTapisan,
    kembaliKeputusan,
    laksana,
    henti,
  };
}
