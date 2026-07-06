/**
 * Pengumpulan permohonan Khidmat Bantu mengikut tarikh aktiviti.
 * Fungsi tulen (tiada IO / tiada server-only) supaya boleh diguna di server
 * mahupun client, dan mudah diuji unit jika runner ditambah kemudian.
 */

import { fromIsoDate } from "@/lib/tempahan/date";
import { getServiceGroup } from "@/lib/khidmat-bantu/config";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";
import type { KhidmatMcpDetails, KhidmatProgramDetails } from "@/lib/schema";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function asProgram(row: KhidmatBantuRow) {
  return row.details as KhidmatProgramDetails;
}
function asMcp(row: KhidmatBantuRow) {
  return row.details as KhidmatMcpDetails;
}
function isMcp(row: KhidmatBantuRow) {
  return getServiceGroup(row.serviceType) === "mcp";
}

/** Tarikh aktiviti (yyyy-MM-dd) ikut kumpulan servis; null jika hilang/tak sah. */
export function getServiceDate(row: KhidmatBantuRow): string | null {
  const raw = isMcp(row) ? asMcp(row).tarikh : asProgram(row).tarikhCadangan;
  return raw && ISO_DATE.test(raw) ? raw : null;
}

export function getServiceTitle(row: KhidmatBantuRow): string {
  return isMcp(row) ? asMcp(row).tajukProgram : asProgram(row).tajuk;
}

export function getServiceTime(row: KhidmatBantuRow): string {
  return (isMcp(row) ? asMcp(row).masa : asProgram(row).masaCadangan) ?? "";
}

export function getServiceLokasi(row: KhidmatBantuRow): string {
  return (row.details as KhidmatProgramDetails | KhidmatMcpDetails).lokasi ?? "";
}

/** "Julai 2026" untuk (tahun, bulan 0-indeks). */
export function monthLabelOf(year: number, month: number): string {
  return fromIsoDate(`${year}-${pad(month + 1)}-01`).toLocaleDateString("ms-MY", {
    month: "long",
    year: "numeric",
  });
}

/** "Julai" sahaja (tahun sudah ditunjuk oleh akordion tahun). */
export function monthNameOf(year: number, month: number): string {
  return fromIsoDate(`${year}-${pad(month + 1)}-01`).toLocaleDateString("ms-MY", {
    month: "long",
  });
}

export type DayGroup = { date: string; rows: KhidmatBantuRow[] };
export type MonthGroup = { month: number; label: string; total: number; days: DayGroup[] };
export type YearGroup = { year: number; total: number; months: MonthGroup[] };
export type GroupedRequests = { years: YearGroup[]; invalid: KhidmatBantuRow[] };

/**
 * Kumpul rekod: Tahun > Bulan > Hari.
 * Tahun & bulan menurun (terkini dahulu), hari menaik dalam bulan.
 * Rekod tarikh tidak sah dikumpul berasingan supaya tidak hilang senyap.
 */
export function groupByServiceDate(rows: KhidmatBantuRow[]): GroupedRequests {
  const invalid: KhidmatBantuRow[] = [];
  const yearMap = new Map<number, Map<number, Map<string, KhidmatBantuRow[]>>>();

  for (const row of rows) {
    const date = getServiceDate(row);
    if (!date) {
      invalid.push(row);
      continue;
    }
    const d = fromIsoDate(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    let months = yearMap.get(year);
    if (!months) {
      months = new Map();
      yearMap.set(year, months);
    }
    let days = months.get(month);
    if (!days) {
      days = new Map();
      months.set(month, days);
    }
    const list = days.get(date);
    if (list) list.push(row);
    else days.set(date, [row]);
  }

  const years: YearGroup[] = [...yearMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => {
      let yearTotal = 0;
      const monthGroups: MonthGroup[] = [...months.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, dayMap]) => {
          const days: DayGroup[] = [...dayMap.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, dayRows]) => ({ date, rows: dayRows }));
          const total = days.reduce((n, day) => n + day.rows.length, 0);
          yearTotal += total;
          return { month, label: monthNameOf(year, month), total, days };
        });
      return { year, total: yearTotal, months: monthGroups };
    });

  return { years, invalid };
}

/** Peta tarikh (yyyy-MM-dd) -> rekod, untuk paparan kalendar. */
export function indexByServiceDate(rows: KhidmatBantuRow[]): Map<string, KhidmatBantuRow[]> {
  const map = new Map<string, KhidmatBantuRow[]>();
  for (const row of rows) {
    const date = getServiceDate(row);
    if (!date) continue;
    const list = map.get(date);
    if (list) list.push(row);
    else map.set(date, [row]);
  }
  return map;
}

/**
 * Grid bulanan (mula Isnin). Setiap sel ialah tarikh yyyy-MM-dd, atau null bagi
 * sel isian di luar bulan. Sentiasa pulangkan baris penuh 7 lajur.
 */
export function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
