/** Satu petak KPI ringkas (nombor + label). */
export type StatKpi = {
  label: string;
  value: number;
};

/** Satu titik siri bulanan. */
export type MonthPoint = {
  bulan: string;
  jumlah: number;
};

/** Satu bar pecahan kategori (teras / dimensi). */
export type BreakdownPoint = {
  label: string;
  jumlah: number;
};
