/** Parser fail AI Tools (CSV paparan daerah atau Excel senarai guru). */

export const OPTIK_PLC_SELESAI_MIN_PCT = 80;

export type OptikPlcStatus = "Selesai" | "Belum";
export type OptikSourceFormat = "school_table" | "teacher_list";

export type OptikSchoolRow = {
  schoolCode: string;
  schoolName: string;
  selesaiBil: number;
  totalBil: number;
  pctAi: number;
  plcStatus: OptikPlcStatus;
};

export type OptikParseResult = {
  format: OptikSourceFormat;
  schools: OptikSchoolRow[];
  selesaiBil: number;
  totalBil: number;
  selesaiPct: number;
  belumBil: number;
  belumPct: number;
  sekolahSelesai: number;
  sekolahBelum: number;
  csv: string;
};

const MS_MONTHS = [
  "Jan",
  "Feb",
  "Mac",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ogo",
  "Sep",
  "Okt",
  "Nov",
  "Dis",
];

export function roundPct(n: number): number {
  return Math.round(n * 100) / 100;
}

export function chartLabelFromDate(ymd: string): string {
  const parts = ymd.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return ymd;
  return `${MS_MONTHS[month - 1]} ${year}`;
}

export function isOptikSpreadsheetName(filename: string, mime = ""): boolean {
  return /\.xlsx?$/i.test(filename) || /spreadsheet|excel/i.test(mime);
}

function parseNumber(raw: string): number | null {
  const t = raw.replace(/%/g, "").replace(",", ".").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseCount(raw: string): number | null {
  const n = parseNumber(raw);
  if (n == null) return null;
  const rounded = Math.round(n);
  return rounded >= 0 ? rounded : null;
}

export function normalizePlcStatus(raw: string): OptikPlcStatus | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return null;
  if (t === "selesai" || t === "siap") return "Selesai";
  if (t === "belum" || t === "belum selesai" || t === "tidak selesai") return "Belum";
  return null;
}

export function plcStatusFromPct(pct: number): OptikPlcStatus {
  return pct >= OPTIK_PLC_SELESAI_MIN_PCT ? "Selesai" : "Belum";
}

const SCHOOL_CODE_RE = /^([A-Za-z]{3}\d{4})\s*[-–—]\s*(.+)$/;

export function parseSchoolField(raw: string): { code: string; name: string } | null {
  const text = raw.replace(/^\ufeff/, "").trim();
  if (!text) return null;
  const m = text.match(SCHOOL_CODE_RE);
  if (m) {
    return { code: m[1].toUpperCase(), name: m[2].trim() };
  }
  const codeOnly = text.match(/^([A-Za-z]{3}\d{4})$/);
  if (codeOnly) return { code: codeOnly[1].toUpperCase(), name: codeOnly[1].toUpperCase() };
  return null;
}

function headerKey(raw: string): string {
  const h = raw.replace(/^\ufeff/, "").trim().toLowerCase().replace(/\s+/g, " ");
  if (h === "✓" || h === "✔" || h === "selesai" || h === "bil. selesai" || h === "bil selesai") {
    return "done";
  }
  if (h === "∑" || h === "jumlah" || h === "total" || h === "bilangan") return "total";
  if (h.includes("%") && h.includes("ai")) return "pct";
  if (h.includes("plc")) return "plc";
  if (h === "sekolah" || h === "nama sekolah") return "school";
  if (h.includes("status")) return "status";
  if (h === "nama") return "nama";
  if (h.includes("email")) return "email";
  return h;
}

export function parseCsvMatrix(csvText: string): string[][] {
  const text = String(csvText ?? "").replace(/^\ufeff/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let i = 0;
  let inQuotes = false;

  const pushCell = () => {
    row.push(cur);
    cur = "";
  };
  const pushRow = () => {
    if (row.some((c) => String(c).trim() !== "") || row.length > 1) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      pushCell();
      i += 1;
      continue;
    }
    if (c === "\n") {
      pushCell();
      pushRow();
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      if (text[i] === "\n") i += 1;
      pushCell();
      pushRow();
      continue;
    }
    cur += c;
    i += 1;
  }
  pushCell();
  if (row.some((c) => String(c).trim() !== "")) pushRow();
  return rows;
}

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function serializeOptikSchoolsCsv(schools: OptikSchoolRow[]): string {
  const lines = ["Sekolah,✓,∑,% AI,☑ PLC"];
  for (const row of schools) {
    const sekolah = `${row.schoolCode}-${row.schoolName}`;
    lines.push(
      [csvCell(sekolah), row.selesaiBil, row.totalBil, row.pctAi, csvCell(row.plcStatus)].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function finalizeSchools(schools: OptikSchoolRow[], format: OptikSourceFormat): OptikParseResult {
  if (schools.length === 0) {
    throw new Error("Fail tidak mengandungi baris sekolah yang sah.");
  }
  const sorted = [...schools].sort((a, b) => {
    if (b.selesaiBil !== a.selesaiBil) return b.selesaiBil - a.selesaiBil;
    return a.schoolCode.localeCompare(b.schoolCode);
  });
  const selesaiBil = sorted.reduce((sum, row) => sum + row.selesaiBil, 0);
  const totalBil = sorted.reduce((sum, row) => sum + row.totalBil, 0);
  if (totalBil <= 0) throw new Error("Jumlah guru dalam fail ialah 0.");
  const belumBil = Math.max(0, totalBil - selesaiBil);
  const selesaiPct = roundPct((100 * selesaiBil) / totalBil);
  const belumPct = roundPct((100 * belumBil) / totalBil);
  const sekolahSelesai = sorted.filter((row) => row.plcStatus === "Selesai").length;
  const sekolahBelum = sorted.length - sekolahSelesai;
  return {
    format,
    schools: sorted,
    selesaiBil,
    totalBil,
    selesaiPct,
    belumBil,
    belumPct,
    sekolahSelesai,
    sekolahBelum,
    csv: serializeOptikSchoolsCsv(sorted),
  };
}

function parseSchoolTable(matrix: string[][]): OptikParseResult {
  const headers = (matrix[0] ?? []).map(headerKey);
  const schoolIdx = headers.indexOf("school");
  const doneIdx = headers.indexOf("done");
  const totalIdx = headers.indexOf("total");
  const pctIdx = headers.indexOf("pct");
  const plcIdx = headers.indexOf("plc");
  if (schoolIdx < 0 || doneIdx < 0 || totalIdx < 0) {
    throw new Error("CSV paparan daerah perlu lajur Sekolah, ✓ dan ∑.");
  }
  const byCode = new Map<string, OptikSchoolRow>();
  for (const row of matrix.slice(1)) {
    const parsed = parseSchoolField(String(row[schoolIdx] ?? ""));
    if (!parsed) continue;
    const selesaiBil = parseCount(String(row[doneIdx] ?? ""));
    const totalBil = parseCount(String(row[totalIdx] ?? ""));
    if (selesaiBil == null || totalBil == null || totalBil <= 0) continue;
    const filePct = pctIdx >= 0 ? parseNumber(String(row[pctIdx] ?? "")) : null;
    const pctAi = roundPct(filePct ?? (100 * selesaiBil) / totalBil);
    const plc =
      plcIdx >= 0 ? normalizePlcStatus(String(row[plcIdx] ?? "")) : null;
    const next: OptikSchoolRow = {
      schoolCode: parsed.code,
      schoolName: parsed.name,
      selesaiBil,
      totalBil,
      pctAi,
      plcStatus: plc ?? plcStatusFromPct(pctAi),
    };
    const prev = byCode.get(parsed.code);
    if (!prev) {
      byCode.set(parsed.code, next);
      continue;
    }
    const mergedTotal = prev.totalBil + next.totalBil;
    const mergedDone = prev.selesaiBil + next.selesaiBil;
    const mergedPct = roundPct((100 * mergedDone) / mergedTotal);
    byCode.set(parsed.code, {
      schoolCode: parsed.code,
      schoolName: prev.schoolName || next.schoolName,
      selesaiBil: mergedDone,
      totalBil: mergedTotal,
      pctAi: mergedPct,
      plcStatus: plc ?? plcStatusFromPct(mergedPct),
    });
  }
  return finalizeSchools([...byCode.values()], "school_table");
}

function parseTeacherList(matrix: string[][]): OptikParseResult {
  const headers = (matrix[0] ?? []).map(headerKey);
  const schoolIdx = headers.indexOf("school");
  const statusIdx = headers.findIndex((h) => h === "status" || h === "plc");
  if (schoolIdx < 0 || statusIdx < 0) {
    throw new Error("Excel senarai guru perlu lajur Sekolah dan Status PLC AI.");
  }
  const byCode = new Map<string, { name: string; done: number; total: number }>();
  for (const row of matrix.slice(1)) {
    const parsed = parseSchoolField(String(row[schoolIdx] ?? ""));
    if (!parsed) continue;
    const status = normalizePlcStatus(String(row[statusIdx] ?? ""));
    if (!status) continue;
    const cur = byCode.get(parsed.code) ?? { name: parsed.name, done: 0, total: 0 };
    cur.total += 1;
    if (status === "Selesai") cur.done += 1;
    if (!cur.name) cur.name = parsed.name;
    byCode.set(parsed.code, cur);
  }
  const schools: OptikSchoolRow[] = [...byCode.entries()].map(([code, row]) => {
    const pctAi = roundPct((100 * row.done) / row.total);
    return {
      schoolCode: code,
      schoolName: row.name,
      selesaiBil: row.done,
      totalBil: row.total,
      pctAi,
      plcStatus: plcStatusFromPct(pctAi),
    };
  });
  return finalizeSchools(schools, "teacher_list");
}

function detectAndParseMatrix(matrix: string[][]): OptikParseResult {
  if (matrix.length < 2) {
    throw new Error("Fail kosong atau tiada baris data.");
  }
  const headers = (matrix[0] ?? []).map(headerKey);
  const hasSchoolTable = headers.includes("school") && headers.includes("done") && headers.includes("total");
  const hasTeacherList =
    headers.includes("school") && (headers.includes("status") || headers.includes("plc"));
  if (hasSchoolTable) return parseSchoolTable(matrix);
  if (hasTeacherList) return parseTeacherList(matrix);
  throw new Error(
    "Format fail tidak dikenali. Guna CSV paparan daerah (Sekolah, ✓, ∑, % AI, PLC) atau Excel senarai guru.",
  );
}

export function parseOptikCsvText(csvText: string): OptikParseResult {
  return detectAndParseMatrix(parseCsvMatrix(csvText));
}

export function parseOptikSpreadsheetBuffer(buffer: Buffer): OptikParseResult {
  // xlsx is CJS; default import works via esModuleInterop.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx") as typeof import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer", sheetRows: 20000, cellDates: false });
  const preferred =
    wb.SheetNames.find((name) => /analisis|daerah|manjung/i.test(name)) ?? wb.SheetNames[0];
  if (!preferred) throw new Error("Fail Excel tiada helaian.");
  const sheet = wb.Sheets[preferred];
  const matrix = (XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  }) as unknown[][])
    .map((row) => row.map((cell) => String(cell ?? "")))
    .filter((row, index) => index === 0 || row.some((cell) => cell.trim() !== ""));
  return detectAndParseMatrix(matrix);
}

export async function parseOptikUpload(file: File): Promise<OptikParseResult> {
  const filename = file.name || "upload.csv";
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isOptikSpreadsheetName(filename, file.type)) {
    return parseOptikSpreadsheetBuffer(buffer);
  }
  return parseOptikCsvText(buffer.toString("utf8"));
}
