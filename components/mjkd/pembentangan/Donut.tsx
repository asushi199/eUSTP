"use client";

import { useEffect, useState } from "react";
import { STATUS_MJKD, type StatusMjkd } from "@/lib/mjkd/enums";

export const WARNA_STATUS_VAR: Record<StatusMjkd, string> = {
  SELESAI: "var(--ok)",
  DALAM_PELAKSANAAN: "var(--amb)",
  BELUM: "var(--bad)",
  TIDAK_BERKAITAN: "var(--tb)",
};

/** Lukisan masuk: lengkok bermula 0 kemudian "dilukis" ke panjang sebenar (transisi CSS). */
function useMasuk(): boolean {
  const [siap, setSiap] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setSiap(true)));
    // rAF boleh dihentikan (tab latar) — pastikan lengkok tetap dilukis.
    const jamin = window.setTimeout(() => setSiap(true), 120);
    return () => {
      cancelAnimationFrame(t);
      window.clearTimeout(jamin);
    };
  }, []);
  return siap;
}

/** Donut status (SVG): segmen ikut bilangan / `jumlah` (sekolah dijangka — baki = belum hantar). */
export function DonutStatus({
  bilangan,
  jumlah,
  saiz = 200,
}: {
  bilangan: Record<StatusMjkd, number>;
  jumlah: number;
  saiz?: number;
}) {
  const siap = useMasuk();
  const r = 80;
  const L = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg viewBox="0 0 200 200" width={saiz} height={saiz} aria-hidden style={{ transform: "rotate(-90deg)" }}>
      <circle r={r} cx="100" cy="100" fill="none" stroke="var(--panel2)" strokeWidth="26" />
      {STATUS_MJKD.map((s) => {
        const len = jumlah ? (bilangan[s] / jumlah) * L : 0;
        const el = (
          <circle
            key={s}
            r={r}
            cx="100"
            cy="100"
            fill="none"
            stroke={WARNA_STATUS_VAR[s]}
            strokeWidth="26"
            strokeDasharray={`${siap ? len : 0} ${L}`}
            strokeDashoffset={-off * (siap ? 1 : 0)}
            style={{ transition: "stroke-dasharray .9s cubic-bezier(.2,.7,.2,1), stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)" }}
          />
        );
        off += len;
        return el;
      })}
    </svg>
  );
}

/** Cincin kemajuan satu nilai (emas). */
export function CincinKemajuan({ nilai, jumlah, saiz = 200 }: { nilai: number; jumlah: number; saiz?: number }) {
  const siap = useMasuk();
  const r = 92;
  const L = 2 * Math.PI * r;
  const len = jumlah ? Math.min(1, nilai / jumlah) * L : 0;
  return (
    <svg viewBox="0 0 220 220" width={saiz} height={saiz} aria-hidden style={{ transform: "rotate(-90deg)" }}>
      <circle r={r} cx="110" cy="110" fill="none" stroke="var(--panel2)" strokeWidth="16" />
      <circle
        r={r}
        cx="110"
        cy="110"
        fill="none"
        stroke="var(--emas)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={`${siap ? len : 0} ${L}`}
        style={{ transition: "stroke-dasharray .9s cubic-bezier(.2,.7,.2,1)" }}
      />
    </svg>
  );
}

/** Bar bertindan status (lebar ikut `jumlah`). */
export function BarStatus({ bilangan, jumlah, tinggi = 22 }: { bilangan: Record<StatusMjkd, number>; jumlah: number; tinggi?: number }) {
  return (
    <div className="pt-bar" style={{ height: tinggi }}>
      {STATUS_MJKD.map((s) => (
        <span
          key={s}
          style={{ width: `${jumlah ? (bilangan[s] / jumlah) * 100 : 0}%`, background: WARNA_STATUS_VAR[s] }}
        />
      ))}
    </div>
  );
}
