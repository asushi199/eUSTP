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
import { VERSI_ENJIN } from "@/lib/tools/semak-ains/versi";

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
export type StatusTindakan = { tindakan: Tindakan; berjaya: boolean; jawapan: string | null; masa: string };
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
const HAD_SAHKAN_MS = 360_000;

export type KiraLaksana = { jumlah: number; diproses: number; berjaya: number; gagal: number };

/** Sambungan postMessage dengan penanda dalam tab AINS (window.opener). */
export function useSambunganAins() {
  const [fasa, setFasa] = useState<Fasa>("semak-sambungan");
  const [sekolah, setSekolah] = useState<InfoSekolah | null>(null);
  const [rekod, setRekod] = useState<RekodAins[]>([]);
  const [bacaan, setBacaan] = useState({ halaman: 0, jumlahHalaman: 0 });
  const [bacaanKe, setBacaanKe] = useState(0);
  const [ralat, setRalat] = useState<string | null>(null);
  const [halamanGagal, setHalamanGagal] = useState<number[]>([]);
  const [status, setStatus] = useState<Map<string, StatusTindakan>>(() => new Map());
  const [kira, setKira] = useState<KiraLaksana>({ jumlah: 0, diproses: 0, berjaya: 0, gagal: 0 });
  const [hasilLaksana, setHasilLaksana] = useState<HasilLaksana | null>(null);
  const tindakanSemasa = useRef<Tindakan>("approved");
  const tapisanAkhir = useRef<Tapisan>({});
  const fasaRef = useRef<Fasa>("semak-sambungan");
  const kiraRef = useRef<KiraLaksana>(kira);
  const terakhirMesej = useRef(0);
  const adaKemajuan = useRef(false);
  fasaRef.current = fasa;
  kiraRef.current = kira;

  const hantar = useCallback((m: TanpaSumber<MesejKeAins>) => {
    window.opener?.postMessage({ ...m, sumber: SUMBER }, ASAL_AINS);
  }, []);

  useEffect(() => {
    if (!window.opener) {
      setFasa("tiada-penanda");
      return;
    }
    setFasa("menunggu");
    const dengar = (e: MessageEvent) => {
      if (e.origin !== ASAL_AINS || e.source !== window.opener || !mesejAinsSah(e.data)) return;
      const d = e.data;
      terakhirMesej.current = Date.now();
      switch (d.jenis) {
        case "sekolah":
          setSekolah({ nama: d.nama, kod: d.kod, versiPenanda: d.versiPenanda });
          setFasa((f) => (f === "menunggu" ? "sedia" : f));
          break;
        case "rekod":
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
        case "kemajuan":
          adaKemajuan.current = true;
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
          if (d.masihMenunggu.length) {
            const menunggu = d.masihMenunggu;
            setStatus((lama) => {
              const baru = new Map(lama);
              for (const id of menunggu) {
                baru.set(id, {
                  tindakan: tindakanSemasa.current,
                  berjaya: false,
                  jawapan: "Masih menunggu dalam AINS",
                  masa: new Date().toISOString(),
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
        window.opener?.postMessage({ sumber: SUMBER, jenis: "henti" }, ASAL_AINS);
      }
    };
    window.addEventListener("message", dengar);
    window.addEventListener("pagehide", hentiJikaSibuk);
    window.opener.postMessage({ sumber: SUMBER, jenis: "sedia", versiEnjin: VERSI_ENJIN }, ASAL_AINS);
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
      if (!window.opener || window.opener.closed) {
        setRalat("Tab AINS telah ditutup. Buka semula AINS, klik penanda dan baca semula.");
        setFasa("keputusan");
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [fasa]);

  // Had masa tanpa respons: tab AINS mungkin tergantung, bertukar halaman atau ditutup tanpa isyarat.
  useEffect(() => {
    if (fasa !== "membaca" && fasa !== "melaksana") return;
    terakhirMesej.current = Date.now();
    const id = window.setInterval(() => {
      let had: number;
      let mesej: string;
      if (fasa === "membaca") {
        had = HAD_BACA_MS;
        mesej = "Tiada respons daripada tab AINS. Klik penanda sekali lagi dalam tab AINS, kemudian baca semula.";
      } else {
        /* Sebelum kemajuan pertama, confirm() dalam AINS mungkin sedang menunggu — tiada had. */
        if (!adaKemajuan.current) return;
        const k = kiraRef.current;
        had = k.diproses >= k.jumlah ? HAD_SAHKAN_MS : HAD_LAKSANA_MS;
        mesej = "Tiada respons daripada tab AINS semasa tindakan. Semak AINS secara manual.";
      }
      if (Date.now() - terakhirMesej.current > had) {
        setRalat(mesej);
        setFasa("keputusan");
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [fasa]);

  const mula = useCallback(
    (tapisan: Tapisan) => {
      tapisanAkhir.current = tapisan;
      setRekod([]);
      setStatus(new Map());
      setHasilLaksana(null);
      setRalat(null);
      setHalamanGagal([]);
      setBacaan({ halaman: 0, jumlahHalaman: 0 });
      setFasa("membaca");
      hantar({ jenis: "mula", tapisan });
    },
    [hantar],
  );

  const bacaSemula = useCallback(() => mula(tapisanAkhir.current), [mula]);

  const laksana = useCallback(
    (tindakan: Tindakan, item: { id: string; komen: string }[], jedaMs: number) => {
      if (item.length === 0) return;
      tindakanSemasa.current = tindakan;
      setHasilLaksana(null);
      setKira({ jumlah: item.length, diproses: 0, berjaya: 0, gagal: 0 });
      adaKemajuan.current = false;
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
    halamanGagal,
    status,
    kira,
    hasilLaksana,
    mula,
    bacaSemula,
    laksana,
    henti,
  };
}
