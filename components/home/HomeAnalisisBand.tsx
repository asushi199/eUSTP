"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import AnalisisKpiTiles from "@/components/analisis/AnalisisKpiTiles";
import KpiGroups from "@/components/analisis/KpiGroups";
import type { AnalisisHomeModule } from "@/lib/analisis/summary";

/* Carta recharts dimuat malas — hanya diambil apabila modal dibuka. */
const chartLoading = () => (
  <div className="card p-5 text-sm text-graphite">Memuatkan carta…</div>
);
const DelimaTrendChart = dynamic(() => import("@/components/analisis/DelimaTrendChart"), {
  ssr: false,
  loading: chartLoading,
});
const BreakdownBarChart = dynamic(() => import("@/components/stats/BreakdownBarChart"), {
  ssr: false,
  loading: chartLoading,
});
const MonthlyLineChart = dynamic(() => import("@/components/stats/MonthlyLineChart"), {
  ssr: false,
  loading: chartLoading,
});

function moduleHasDetail(mod: AnalisisHomeModule): boolean {
  return (
    mod.tiles.some((t) => t.value !== "") ||
    (mod.delimaTrend?.points.length ?? 0) > 0 ||
    mod.bars.some((b) => b.data.length > 0) ||
    (mod.line?.data.length ?? 0) > 0
  );
}

/**
 * Jalur "Analisis Semasa" halaman utama: satu kad kecil setiap modul
 * Analisis USTP; klik kad membuka modal dengan carta penuh modul itu.
 */
export default function HomeAnalisisBand({ modules }: { modules: AnalisisHomeModule[] }) {
  const [openId, setOpenId] = useState<AnalisisHomeModule["id"] | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const active = modules.find((m) => m.id === openId) ?? null;

  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {modules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => setOpenId(mod.id)}
            className="card group p-4 text-left transition hover:-translate-y-0.5 hover:shadow-modal focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-haspopup="dialog"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
                {mod.label}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                className="h-3.5 w-3.5 shrink-0 text-steel transition group-hover:text-primary"
                aria-hidden
              >
                <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
              </svg>
            </span>
            <span className="mt-2 block text-2xl font-semibold tabular-nums tracking-tight text-primary">
              {mod.headlineValue || "—"}
            </span>
            <span className="mt-1 block text-xs leading-snug text-graphite">
              {mod.headlineValue ? mod.headlineLabel : "Data belum tersedia"}
            </span>
          </button>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
          onClick={() => setOpenId(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="analisis-modal-title"
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-modal sm:rounded-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
                  Analisis USTP
                </p>
                <h3 id="analisis-modal-title" className="mt-1 text-xl font-semibold tracking-tight">
                  {active.label}
                </h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Tutup"
                className="rounded-md p-2 text-graphite hover:bg-cloud hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {moduleHasDetail(active) ? (
              <div className="mt-4 space-y-4">
                {active.note ? (
                  <p className="text-sm leading-relaxed text-graphite">{active.note}</p>
                ) : null}
                {active.tileGroups ? (
                  <KpiGroups groups={active.tileGroups} />
                ) : (
                  <AnalisisKpiTiles tiles={active.tiles} />
                )}
                {active.delimaTrend && active.delimaTrend.points.length > 0 ? (
                  <DelimaTrendChart
                    data={active.delimaTrend.points}
                    kpiGuru={active.delimaTrend.kpiGuru}
                  />
                ) : null}
                {active.bars.map((bar) => (
                  <BreakdownBarChart
                    key={bar.title}
                    title={bar.title}
                    data={bar.data}
                    seriesName={bar.seriesName}
                  />
                ))}
                {active.line ? (
                  <MonthlyLineChart
                    title={active.line.title}
                    data={active.line.data}
                    seriesName={active.line.seriesName}
                  />
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-graphite">
                Data modul ini belum tersedia. Sila semak semula kemudian.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
