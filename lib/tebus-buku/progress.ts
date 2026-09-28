export type TebusStatusSplit = {
  total: number;
  selesai: number;
  belumGuna: number;
  belumTebus: number;
};

function clampCount(value: number, max: number): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, max);
}

/** Tiga status yang saling melengkapi: selesai, sudah tebus belum guna, belum tebus. */
export function splitTebusStatus(input: {
  total: number;
  tebusCount: number;
  gunaCount: number;
}): TebusStatusSplit {
  const total = clampCount(input.total, Number.MAX_SAFE_INTEGER);
  const tebus = clampCount(input.tebusCount, total);
  const selesai = clampCount(input.gunaCount, tebus);
  return {
    total,
    selesai,
    belumGuna: tebus - selesai,
    belumTebus: total - tebus,
  };
}

export function percentLabel(count: number, total: number): string {
  if (total <= 0 || count <= 0) return "0%";
  const pct = (count / total) * 100;
  if (pct < 0.5) return "<1%";
  return `${Math.round(pct)}%`;
}
