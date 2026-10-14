"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bezaData, type DataPentas, type VersiPentas } from "@/lib/mjkd/pembentangan";

type Hasil<T> = ({ ok: true } & T) | { ok: false; error: string };

/** Sumber data (lalai: server action; pratonton dev boleh menggantikannya). */
export type SumberData = {
  versi: () => Promise<Hasil<{ versi: VersiPentas }>>;
  penuh: () => Promise<Hasil<{ data: DataPentas }>>;
  kehadiran: () => Promise<Hasil<{ kehadiran: DataPentas["kehadiran"] }>>;
};

export type StatusData = {
  /** langsung = semakan terakhir berjaya; lapuk = semakan terakhir gagal; luar-talian = dari cache. */
  jenis: "langsung" | "lapuk" | "luar-talian";
  /** Masa data terakhir disahkan terkini. */
  masa: Date | null;
};

/** Tempoh denyutan "BARU" pada jubin (ms). */
export const TEMPOH_BARU_MS = 60_000;

const kunciCache = (id: string) => `mjkd-pentas-${id}`;

function bacaCache(id: string): { data: DataPentas; masa: string } | null {
  try {
    const raw = window.localStorage.getItem(kunciCache(id));
    if (!raw) return null;
    const v = JSON.parse(raw) as { data?: DataPentas; masa?: string };
    return v.data && v.masa ? { data: v.data, masa: v.masa } : null;
  } catch {
    return null;
  }
}

function tulisCache(id: string, data: DataPentas, masa: Date) {
  try {
    window.localStorage.setItem(kunciCache(id), JSON.stringify({ data, masa: masa.toISOString() }));
  } catch {
    /* kuota penuh / storan disekat — abaikan */
  }
}

/**
 * Data langsung mod pembentangan: semakan versi ringan setiap `selangMs` (hanya bila tab
 * kelihatan); muat semula penuh bila maklum balas/bahan/perkara berubah, kehadiran sahaja bila
 * hanya kehadiran berubah. Data terakhir disimpan di localStorage (dibuka semula tanpa rangkaian).
 */
export function useDataLangsung({
  mesyuaratId,
  awal,
  sumber,
  selangMs,
  onBaru,
}: {
  mesyuaratId: string;
  awal: DataPentas | null;
  sumber: SumberData;
  selangMs: number;
  /** Dipanggil dengan kod sekolah yang baru menghantar maklum balas. */
  onBaru?: (kod: string[]) => void;
}) {
  const [data, setData] = useState<DataPentas | null>(awal);
  const [status, setStatus] = useState<StatusData>({
    jenis: "langsung",
    masa: awal ? new Date(awal.dimuatPada) : null,
  });
  const [sedang, setSedang] = useState(false);
  const dataRef = useRef(data);
  const versiRef = useRef<VersiPentas | null>(null);
  // Data awal daripada halaman masih segar: semakan pertama hanya menyimpan versi.
  const perluPenuhRef = useRef(awal === null);
  const jalanRef = useRef(false);
  const onBaruRef = useRef(onBaru);
  onBaruRef.current = onBaru;

  // Tiada data pelayan (DB perlahan semasa halaman dimuat) -> cache localStorage.
  useEffect(() => {
    if (awal) return;
    const c = bacaCache(mesyuaratId);
    if (c) {
      dataRef.current = c.data;
      setData(c.data);
      setStatus({ jenis: "luar-talian", masa: new Date(c.masa) });
    }
  }, [awal, mesyuaratId]);

  const pasang = useCallback(
    (baru: DataPentas, masa: Date) => {
      const lama = dataRef.current;
      if (lama) {
        const beza = bezaData(lama, baru);
        if (beza.maklumBalas.size > 0) onBaruRef.current?.([...beza.maklumBalas]);
      }
      dataRef.current = baru;
      setData(baru);
      tulisCache(mesyuaratId, baru, masa);
    },
    [mesyuaratId],
  );

  useEffect(() => {
    if (awal) tulisCache(mesyuaratId, awal, new Date(awal.dimuatPada));
  }, [awal, mesyuaratId]);

  const segar = useCallback(
    async (paksa = false) => {
      if (jalanRef.current) return;
      jalanRef.current = true;
      setSedang(true);
      try {
        const v = await sumber.versi();
        if (!v.ok) {
          setStatus((s) => ({ jenis: s.jenis === "luar-talian" ? s.jenis : "lapuk", masa: s.masa }));
          return;
        }
        const lama = versiRef.current;
        const kini = new Date();
        if (paksa || perluPenuhRef.current || !dataRef.current || (lama && lama.utama !== v.versi.utama)) {
          const p = await sumber.penuh();
          if (!p.ok) {
            setStatus((s) => ({ jenis: s.jenis === "luar-talian" ? s.jenis : "lapuk", masa: s.masa }));
            return;
          }
          pasang(p.data, kini);
          perluPenuhRef.current = false;
        } else if (lama && lama.hadir !== v.versi.hadir) {
          const k = await sumber.kehadiran();
          if (!k.ok) {
            setStatus((s) => ({ jenis: "lapuk", masa: s.masa }));
            return;
          }
          pasang({ ...dataRef.current, kehadiran: k.kehadiran }, kini);
        }
        versiRef.current = v.versi;
        setStatus({ jenis: "langsung", masa: kini });
      } catch {
        // Rangkaian terputus (fetch server action gagal) — kekalkan data terakhir.
        setStatus((s) => ({ jenis: s.jenis === "luar-talian" ? s.jenis : "lapuk", masa: s.masa }));
      } finally {
        jalanRef.current = false;
        setSedang(false);
      }
    },
    [pasang, sumber],
  );

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void segar();
    };
    tick();
    const t = window.setInterval(tick, selangMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [segar, selangMs]);

  /** Kemas kini setempat (cth. Sorotan optimistik). */
  const ubahSetempat = useCallback((fn: (d: DataPentas) => DataPentas) => {
    const d = dataRef.current;
    if (!d) return;
    const baru = fn(d);
    dataRef.current = baru;
    setData(baru);
  }, []);

  return { data, status, sedang, segar, ubahSetempat };
}
