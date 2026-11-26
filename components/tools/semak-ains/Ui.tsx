import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Warna } from "@/lib/tools/semak-ains/jenis";
import { WARNA_STATUS } from "./warna";

/* Unsur UI kecil dikongsi halaman SahPantas AINS. */

const LALUAN_IKON = {
  sekolah: "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6",
  tukar: "M4 7h13l-3-3M20 17H7l3 3",
  ulang: "M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6",
  muat: "M12 4v11m0 0-4-4m4 4 4-4M5 20h14",
  tetapan: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  luar: "M14 5h5v5M19 5l-8 8M18 14v5H5V6h5",
  amaran: "M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  info: "M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  betul: "M20 6 9 17l-5-5",
  kunci: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z",
  tutup: "M18 6 6 18M6 6l12 12",
  cari: "m21 21-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
} as const;

export type NamaIkon = keyof typeof LALUAN_IKON;

export function Ikon({ nama, className }: { nama: NamaIkon; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden
    >
      <path d={LALUAN_IKON[nama]} />
    </svg>
  );
}

/** Titik status tiga warna (pengecualian reka bentuk terhad — spesifikasi §4.2). */
export function TitikWarna({ warna, className }: { warna: Warna; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: WARNA_STATUS[warna].warna }}
      aria-hidden
    />
  );
}

/** Notis sebaris (ralat/amaran/maklumat) — satu gaya untuk semua mesej halaman. */
export function Notis({
  jenis = "amaran",
  tajuk,
  children,
  className,
}: {
  jenis?: "amaran" | "info" | "berjaya";
  tajuk?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const ikon: NamaIkon = jenis === "amaran" ? "amaran" : jenis === "berjaya" ? "betul" : "info";
  return (
    <div
      role={jenis === "amaran" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-xl border border-fog bg-white p-4 text-sm shadow-lift", className)}
    >
      <Ikon nama={ikon} className={cn("mt-0.5 h-5 w-5", jenis === "amaran" ? "text-bloom-deep" : "text-ink")} />
      <div className="min-w-0 flex-1 text-graphite">
        {tajuk ? <p className="font-semibold text-ink">{tajuk}</p> : null}
        {children ? <div className={tajuk ? "mt-0.5" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}

/** Kad kemajuan untuk fasa membaca & melaksana. */
export function KadKemajuan({
  tajuk,
  keterangan,
  peratus,
  nota,
  onHenti,
}: {
  tajuk: string;
  keterangan: string;
  /** null = belum diketahui (bar berdenyut). */
  peratus: number | null;
  nota: string;
  onHenti: () => void;
}) {
  return (
    <section className="card p-6 sm:p-8" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink">{tajuk}</p>
          <p className="mt-1 text-sm tabular-nums text-graphite">{keterangan}</p>
        </div>
        {peratus !== null ? (
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">{peratus}%</p>
        ) : null}
      </div>
      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-fog"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={peratus ?? undefined}
        aria-label={tajuk}
      >
        <div
          className={cn("h-full rounded-full bg-ink transition-[width] duration-500", peratus === null && "w-1/3 animate-pulse")}
          style={peratus !== null ? { width: `${Math.max(peratus, 2)}%` } : undefined}
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-graphite">{nota}</p>
        <button type="button" className="btn-outline-ink btn-sm" onClick={onHenti}>
          Henti
        </button>
      </div>
    </section>
  );
}
