import "server-only";

import type { AnalisisHomeModule } from "@/lib/analisis/summary";
import {
  emptyKhidmatAnalisis,
  getKhidmatAnalisis,
  minKhidmatYear,
  type KhidmatAnalisis,
} from "@/lib/stats/khidmat-bantu";
import {
  emptyPinjamanAnalisis,
  getPinjamanAnalisis,
  minPinjamanYear,
  type PinjamanAnalisis,
} from "@/lib/stats/pinjaman";
import {
  emptyTempahanAnalisis,
  getTempahanAnalisis,
  minTempahanYear,
  type TempahanAnalisis,
} from "@/lib/stats/tempahan";
import { currentStatsYear, yearRange } from "@/lib/stats/year";
import type { BreakdownPoint, MonthPoint, StatKpi } from "@/lib/stats/types";

export const PERKHIDMATAN_IDS = [
  "khidmat-bantu",
  "pinjaman-aset",
  "tempahan-pkg",
] as const;

export type PerkhidmatanId = (typeof PERKHIDMATAN_IDS)[number];

export type PerkhidmatanAnalisis = {
  year: number;
  years: number[];
  khidmat: KhidmatAnalisis;
  pinjaman: PinjamanAnalisis;
  tempahan: TempahanAnalisis;
};

function bil(n: number): string {
  return n.toLocaleString("ms-MY");
}

function tilesOf(kpi: StatKpi[]): { label: string; value: string }[] {
  return kpi.map((t) => ({ label: t.label, value: bil(t.value) }));
}

function barsOf(
  items: { title: string; seriesName: string; data: BreakdownPoint[] }[],
) {
  return items;
}

function lineOf(title: string, seriesName: string, data: MonthPoint[]) {
  return { title, seriesName, data };
}

function toModule(
  id: PerkhidmatanId,
  label: string,
  headlineLabel: string,
  kpi: StatKpi[],
  bars: { title: string; seriesName: string; data: BreakdownPoint[] }[],
  lineTitle: string,
  lineSeries: string,
  monthly: MonthPoint[],
): AnalisisHomeModule {
  return {
    id,
    label,
    headlineValue: kpi[0] ? bil(kpi[0].value) : "0",
    headlineLabel,
    tiles: tilesOf(kpi),
    bars: barsOf(bars),
    line: lineOf(lineTitle, lineSeries, monthly),
  };
}

export async function listPerkhidmatanYears(): Promise<number[]> {
  const current = currentStatsYear();
  const mins = await Promise.all([
    minKhidmatYear().catch(() => null),
    minPinjamanYear().catch(() => null),
    minTempahanYear().catch(() => null),
  ]);
  const found = mins.filter((n): n is number => n != null && Number.isFinite(n));
  return yearRange(found.length ? Math.min(...found) : current, current);
}

export function emptyPerkhidmatanAnalisis(year: number): PerkhidmatanAnalisis {
  return {
    year,
    years: [year],
    khidmat: emptyKhidmatAnalisis(year),
    pinjaman: emptyPinjamanAnalisis(),
    tempahan: emptyTempahanAnalisis(),
  };
}

export async function getPerkhidmatanAnalisis(year: number): Promise<PerkhidmatanAnalisis> {
  const [years, khidmat, pinjaman, tempahan] = await Promise.all([
    listPerkhidmatanYears(),
    getKhidmatAnalisis(year).catch((e) => {
      console.error("[perkhidmatan] khidmat:", e instanceof Error ? e.message : e);
      return emptyKhidmatAnalisis(year);
    }),
    getPinjamanAnalisis(year).catch((e) => {
      console.error("[perkhidmatan] pinjaman:", e instanceof Error ? e.message : e);
      return emptyPinjamanAnalisis();
    }),
    getTempahanAnalisis(year).catch((e) => {
      console.error("[perkhidmatan] tempahan:", e instanceof Error ? e.message : e);
      return emptyTempahanAnalisis();
    }),
  ]);
  return { year, years, khidmat, pinjaman, tempahan };
}

export function perkhidmatanToHomeModules(
  data: PerkhidmatanAnalisis,
): AnalisisHomeModule[] {
  return [
    toModule(
      "khidmat-bantu",
      "Khidmat Bantu",
      "Diluluskan",
      data.khidmat.kpi,
      [
        {
          title: "Ikut jenis perkhidmatan",
          seriesName: "Permohonan",
          data: data.khidmat.byJenis,
        },
        {
          title: "Ikut jenis pemohon",
          seriesName: "Permohonan",
          data: data.khidmat.byPemohon,
        },
      ],
      "Trend bulanan",
      "Permohonan",
      data.khidmat.monthly,
    ),
    toModule(
      "pinjaman-aset",
      "Pinjaman Aset",
      "Permohonan diluluskan",
      data.pinjaman.kpi,
      [
        { title: "Ikut PKG", seriesName: "Permohonan", data: data.pinjaman.byPkg },
        {
          title: "Ikut jenis peralatan",
          seriesName: "Unit dimohon",
          data: data.pinjaman.byJenis,
        },
      ],
      "Trend bulanan",
      "Permohonan",
      data.pinjaman.monthly,
    ),
    toModule(
      "tempahan-pkg",
      "Tempahan PKG",
      "Aktiviti diluluskan",
      data.tempahan.kpi,
      [
        { title: "Ikut PKG", seriesName: "Aktiviti", data: data.tempahan.byPkg },
        { title: "Pagi · Petang", seriesName: "Slot", data: data.tempahan.bySlot },
      ],
      "Trend bulanan",
      "Aktiviti",
      data.tempahan.monthly,
    ),
  ];
}

export async function getPerkhidmatanHomeModules(
  year: number,
): Promise<{ modules: AnalisisHomeModule[]; years: number[]; year: number }> {
  const data = await getPerkhidmatanAnalisis(year);
  return { modules: perkhidmatanToHomeModules(data), years: data.years, year: data.year };
}
