"use server";

import {
  getPerkhidmatanAnalisis,
  perkhidmatanToHomeModules,
} from "@/lib/analisis/perkhidmatan";
import type { AnalisisHomeModule } from "@/lib/analisis/summary";
import { clampStatsYear, currentStatsYear } from "@/lib/stats/year";

export async function loadPerkhidmatanAnalisis(
  year: number,
): Promise<{ modules: AnalisisHomeModule[]; years: number[] }> {
  const y = clampStatsYear(String(year), currentStatsYear());
  const data = await getPerkhidmatanAnalisis(y);
  return { modules: perkhidmatanToHomeModules(data), years: data.years };
}
