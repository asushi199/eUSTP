"use client";

import { useEffect, useMemo, useState } from "react";
import { hariIniKl } from "@/lib/mjkd/enums";
import type { DataPentas } from "@/lib/mjkd/pembentangan";
import Pentas, { type SumberPentas } from "./Pentas";
import { binaContoh, fotoContoh, type SimContoh } from "./contoh";

declare global {
  interface Window {
    __mjkdSim?: SimContoh & { gagal?: boolean };
  }
}

const semakGagal = (sim: { gagal?: boolean }) => {
  if (sim.gagal) throw new Error("rangkaian (simulasi)");
};

const salin = (d: DataPentas): DataPentas => JSON.parse(JSON.stringify(d)) as DataPentas;

/**
 * Pembungkus pratonton dev: sumber data disimulasi (tiada DB). Konsol:
 * `__mjkdSim.hantar()` = satu sekolah baru menghantar; `__mjkdSim.hadir(3)` = 3 sekolah hadir.
 * `?auto=1` = simulasi automatik (hantar setiap 12 s, hadir setiap 4 s).
 * `__mjkdSim.gagal = true` = rangkaian terputus; `?luar=1` = halaman tanpa data pelayan (cache).
 */
export default function PentasContoh({ qr, url, luar }: { qr: string; url: string; luar: boolean }) {
  // `luar`: rangkaian juga "terputus" sejak awal (uji paparan daripada cache).
  const [sim] = useState(() => Object.assign(binaContoh(hariIniKl()), { gagal: luar }));
  const awal = useMemo(() => (luar ? null : salin(sim.data)), [sim, luar]);

  useEffect(() => {
    window.__mjkdSim = sim;
    if (!new URLSearchParams(window.location.search).has("auto")) return;
    const a = window.setInterval(() => sim.hantar(), 12_000);
    const b = window.setInterval(() => sim.hadir(1), 4_000);
    return () => {
      window.clearInterval(a);
      window.clearInterval(b);
    };
  }, [sim]);

  const sumber = useMemo<SumberPentas>(
    () => ({
      versi: async () => {
        semakGagal(sim);
        return { ok: true, versi: { utama: String(sim.versi.utama), hadir: String(sim.versi.hadir) } };
      },
      penuh: async () => ({ ok: true, data: { ...salin(sim.data), dimuatPada: new Date().toISOString() } }),
      kehadiran: async () => ({ ok: true, kehadiran: salin(sim.data).kehadiran }),
      sorotan: async (itemId, dipilih) => {
        const it = sim.data.items.find((x) => x.id === itemId);
        if (it) it.dipilih = dipilih;
        return { ok: true };
      },
    }),
    [sim],
  );

  return (
    <Pentas
      mesyuaratId="contoh"
      awal={awal}
      acara={{ tarikh: "21–22 Oktober 2026", tempat: "Hotel Rosa Passadena, Cameron Highland" }}
      kehadiran={{ url, qr }}
      sumber={sumber}
      keluarHref="/"
      urlFoto={fotoContoh}
    />
  );
}
