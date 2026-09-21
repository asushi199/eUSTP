"use server";

import {
  getPerkhidmatanAnalisis,
  listPerkhidmatanYears,
  perkhidmatanToHomeModules,
} from "@/lib/analisis/perkhidmatan";
import type { AnalisisHomeModule } from "@/lib/analisis/summary";
import { currentStatsYear, parseStatsYear } from "@/lib/stats/year";

export async function loadPerkhidmatanAnalisis(
  year: number,
): Promise<AnalisisHomeModule[]> {
  const years = await listPerkhidmatanYears();
  const y = parseStatsYear(String(year), years, currentStatsYear());
  const data = await getPerkhidmatanAnalisis(y);
  return perkhidmatanToHomeModules(data);
}
