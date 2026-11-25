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
    window.addEventListener("message", dengar);
    window.opener.postMessage({ sumber: SUMBER, jenis: "sedia", versiEnjin: VERSI_ENJIN }, ASAL_AINS);
    return () => window.removeEventListener("message", dengar);
  }, []);

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
