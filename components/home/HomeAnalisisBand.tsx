"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AnalisisKpiTiles from "@/components/analisis/AnalisisKpiTiles";
import KpiGroups from "@/components/analisis/KpiGroups";
import TahunSelect from "@/components/analisis/TahunSelect";
import { loadPerkhidmatanAnalisis } from "@/lib/actions/analisis-perkhidmatan";
import type { AnalisisHomeModule } from "@/lib/analisis/summary";
import DelimaExplore, { type DelimaExploreLayer } from "@/components/analisis/DelimaExplore";
import OptikExplore, { type OptikExploreLayer } from "@/components/analisis/OptikExplore";

const PERKHIDMATAN_IDS = new Set(["khidmat-bantu", "pinjaman-aset", "tempahan-pkg"]);

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

function AnalisisModuleBody({
  active,
  loadingYear,
}: {
  active: AnalisisHomeModule;
  loadingYear: boolean;
}) {
  if (!moduleHasDetail(active)) {
    return (
      <p className="mt-4 text-sm text-graphite">
        Data modul ini belum tersedia. Sila semak semula kemudian.
      </p>
    );
  }
  return (
    <div className={`mt-4 space-y-4 ${loadingYear ? "opacity-60" : ""}`}>
      {active.yearLabel || active.callout ? (
        <div className="flex flex-wrap items-center gap-2">
          {active.yearLabel ? (
            <span className="text-sm font-semibold text-ink">{active.yearLabel}</span>
          ) : null}
          {active.callout ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-ink px-2.5 py-1 text-xs font-semibold text-white">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bloom-coral" aria-hidden />
              {active.callout}
            </span>
          ) : null}
        </div>
      ) : null}
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
      {statRows(active).length > 0 ? (
        <ul className="divide-y divide-fog overflow-hidden rounded-lg border border-fog">
          {statRows(active).map((item) => (
            <li key={item.title} className="flex items-start gap-4 px-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.detail ? (
                  <p className="mt-1 text-xs leading-relaxed text-graphite">{item.detail}</p>
                ) : null}
                {item.meta ? (
                  <p className="mt-1.5 text-xs font-semibold text-ink">{item.meta}</p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="whitespace-nowrap text-xl font-semibold tabular-nums tracking-tight text-ink sm:text-2xl">
                  {item.value}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-[11px] leading-snug text-graphite">{item.unit}</p>
              </div>
            </li>
          ))}
        </ul>
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
          percent={active.line.percent}
          referenceY={active.line.referenceY}
          referenceLabel={active.line.referenceLabel}
          referenceLines={active.line.referenceLines}
        />
      ) : null}
    </div>
  );
}

function moduleHasDetail(mod: AnalisisHomeModule): boolean {
  return (
    mod.tiles.some((t) => t.value !== "") ||
    (mod.delimaTrend?.points.length ?? 0) > 0 ||
    mod.bars.some((b) => b.data.length > 0) ||
    (mod.line?.data.length ?? 0) > 0 ||
    (mod.bengkel?.length ?? 0) > 0 ||
    (mod.statRows?.length ?? 0) > 0
  );
}

function statRows(
  mod: AnalisisHomeModule,
): { title: string; detail?: string; meta?: string; value: string; unit: string }[] {
  if (mod.statRows && mod.statRows.length > 0) return mod.statRows;
  return (mod.bengkel ?? []).map((item) => ({
    title: item.title,
    detail: item.program,
    meta: item.peruntukan ? `Jumlah Peruntukan: ${item.peruntukan}` : undefined,
    value: item.value,
    unit: item.unit,
  }));
}

function ModuleCard({
  mod,
  onOpen,
}: {
  mod: AnalisisHomeModule;
  onOpen: (id: AnalisisHomeModule["id"]) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(mod.id)}
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
  );
}

/**
 * Jalur CoE Analytics halaman utama: baris indikator USTP + baris perkhidmatan.
 * Klik kad membuka modal dengan carta penuh modul itu.
 */
export default function HomeAnalisisBand({
  indikator,
  perkhidmatan,
  years,
  initialYear,
}: {
  indikator: AnalisisHomeModule[];
  perkhidmatan: AnalisisHomeModule[] | null;
  years: number[];
  initialYear: number;
}) {
  const [openId, setOpenId] = useState<AnalisisHomeModule["id"] | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tahun, setTahun] = useState(initialYear);
  const [yearOptions, setYearOptions] = useState(years);
  const [perkData, setPerkData] = useState(perkhidmatan ?? []);
  const [chartsYear, setChartsYear] = useState<number | null>(null);
  const [loadingYear, setLoadingYear] = useState(false);
  const [optikLayer, setOptikLayer] = useState<OptikExploreLayer>("overview");
  const [delimaLayer, setDelimaLayer] = useState<DelimaExploreLayer>("overview");
  const closeRef = useRef<HTMLButtonElement>(null);
  const tebus = indikator.find((m) => m.id === "tebus-buku") ?? null;
  const lead = indikator.filter((m) => m.id !== "tebus-buku");
  const active =
    lead.find((m) => m.id === openId) ??
    (tebus?.id === openId ? tebus : null) ??
    perkData.find((m) => m.id === openId) ??
    null;
  const perkhidmatanOpen = openId != null && PERKHIDMATAN_IDS.has(openId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPerkData(perkhidmatan ?? []);
    setChartsYear(null);
  }, [perkhidmatan]);

  useEffect(() => {
    setTahun(initialYear);
  }, [initialYear]);

  useEffect(() => {
    if (openId !== "optik") setOptikLayer("overview");
    if (openId !== "delima") setDelimaLayer("overview");
  }, [openId]);

  useEffect(() => {
    setYearOptions(years);
  }, [years]);

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

  async function loadPerk(next: number) {
    setLoadingYear(true);
    try {
      const result = await loadPerkhidmatanAnalisis(next);
      setPerkData(result.modules);
      setYearOptions(result.years);
      setChartsYear(next);
    } finally {
      setLoadingYear(false);
    }
  }

  function openModule(id: AnalisisHomeModule["id"]) {
    setOpenId(id);
    if (PERKHIDMATAN_IDS.has(id) && chartsYear !== tahun) {
      void loadPerk(tahun);
    }
  }

  async function changeTahun(next: number) {
    if (next === tahun && chartsYear === next) return;
    setTahun(next);
    await loadPerk(next);
  }

  return (
    <>
      {lead.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lead.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} onOpen={setOpenId} />
          ))}
        </div>
      ) : null}
      {tebus || perkhidmatan ? (
        <div
          className={`mt-3 grid gap-3 ${tebus ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}
        >
          {tebus ? <ModuleCard mod={tebus} onOpen={setOpenId} /> : null}
          {perkhidmatan
            ? perkData.map((mod) => (
                <ModuleCard key={mod.id} mod={mod} onOpen={openModule} />
              ))
            : null}
        </div>
      ) : null}
      {perkhidmatan ? null : (
        <div className="card mt-3 p-4 text-sm text-graphite">
          Analisis perkhidmatan tidak dapat dimuatkan buat masa ini.
        </div>
      )}

      {mounted && active
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
              onClick={() => setOpenId(null)}
              role="presentation"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="analisis-modal-title"
                className={`relative z-[71] max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-modal sm:rounded-2xl sm:p-6 ${
                  openId === "bengkel" || openId === "tebus-buku"
                    ? "max-w-3xl"
                    : (openId === "optik" && optikLayer !== "overview") || openId === "delima"
                      ? "max-w-4xl"
                      : "max-w-2xl"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.08em] text-graphite">
                      CoE Analytics
                    </p>
                    <h3 id="analisis-modal-title" className="mt-1 text-xl font-semibold tracking-tight">
                      {active.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {perkhidmatanOpen ? (
                      <TahunSelect year={tahun} years={yearOptions} onChange={changeTahun} />
                    ) : null}
                    <button
                      ref={closeRef}
                      type="button"
                      onClick={() => setOpenId(null)}
                      aria-label="Tutup"
                      className="relative z-10 -mr-1 -mt-1 rounded-md p-2 text-graphite hover:bg-cloud hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
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
                </div>

                {perkhidmatanOpen && loadingYear ? (
                  <p className="mt-4 text-sm text-graphite">Memuatkan carta…</p>
                ) : null}
                {active.id === "optik" ? (
                  <OptikExplore key={openId} onLayerChange={setOptikLayer}>
                    <AnalisisModuleBody active={active} loadingYear={loadingYear} />
                  </OptikExplore>
                ) : active.id === "delima" && active.delimaLive ? (
                  <DelimaExplore key={openId} onLayerChange={setDelimaLayer}>
                    <AnalisisModuleBody active={active} loadingYear={loadingYear} />
                  </DelimaExplore>
                ) : (
                  <AnalisisModuleBody active={active} loadingYear={loadingYear} />
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
