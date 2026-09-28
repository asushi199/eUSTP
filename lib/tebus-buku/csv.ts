import { csvCell } from "./format";

const EXPECTED_HEADER = [
  "ppd",
  "kod",
  "nama sekolah",
  "nama",
  "email",
  "tingkatan",
  "tebus",
  "guna",
] as const;

const MAX_ROWS = 80_000;

const MONTH_TOKENS: Record<string, number> = {
  jan: 1,
  januari: 1,
  january: 1,
  feb: 2,
  februari: 2,
  february: 2,
  mac: 3,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  mei: 5,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  julai: 7,
  july: 7,
  ogo: 8,
  ogos: 8,
  aug: 8,
  ogs: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oct: 10,
  oktober: 10,
  october: 10,
  nov: 11,
  november: 11,
  dis: 12,
  dec: 12,
  disember: 12,
  december: 12,
};

export class TebusBukuCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TebusBukuCsvError";
  }
}

export type TebusBukuDraftRow = {
  schoolCode: string;
  schoolName: string;
  nama: string;
  email: string;
  tingkatan: string;
  sudahTebus: boolean;
  sudahGuna: boolean;
};

export type TebusBukuImportRow = TebusBukuDraftRow & { sourcedAt: string };

export type TebusBukuImportSummary = {
  pelajar: number;
  sekolah: number;
  sudahTebus: number;
  sudahGuna: number;
};

export function parseCsvLine(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current.trim());
  return parts;
}

function headerOk(parts: string[]): boolean {
  const got = parts.slice(0, EXPECTED_HEADER.length).map((part) => part.trim().toLowerCase());
  return EXPECTED_HEADER.every((label, index) => got[index] === label);
}

/** Baris PPD MANJUNG sahaja. Emel pendua dikekalkan rekod pertama. */
export function parseManjungCsv(text: string): TebusBukuDraftRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  let index = 0;
  while (index < lines.length && lines[index].trim() === "") index += 1;
  if (index >= lines.length) throw new TebusBukuCsvError("Fail kosong.");

  if (!headerOk(parseCsvLine(lines[index]))) {
    throw new TebusBukuCsvError(
      "Tajuk lajur tidak sepadan. Eksport mesti bermula dengan PPD, Kod, Nama Sekolah, Nama, Email, Tingkatan, Tebus, Guna.",
    );
  }

  const rows: TebusBukuDraftRow[] = [];
  const seen = new Set<string>();

  for (let i = index + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const parts = parseCsvLine(line);
    const ppd = (parts[0] ?? "").trim().toUpperCase();
    if (ppd !== "PPD MANJUNG") continue;

    const schoolCode = (parts[1] ?? "").trim().toUpperCase();
    const schoolName = (parts[2] ?? "").trim();
    const nama = (parts[3] ?? "").trim();
    const email = (parts[4] ?? "").trim().toLowerCase();
    const tingkatan = (parts[5] ?? "").trim();
    if (!schoolCode || !nama || !email) continue;
    if (seen.has(email)) continue;
    seen.add(email);

    rows.push({
      schoolCode,
      schoolName,
      nama,
      email,
      tingkatan,
      sudahTebus: (parts[6] ?? "").trim().toLowerCase() === "sudah tebus",
      sudahGuna: (parts[7] ?? "").trim().toLowerCase() === "sudah guna",
    });

    if (rows.length > MAX_ROWS) {
      throw new TebusBukuCsvError("Terlalu banyak rekod PPD MANJUNG. Semak fail eksport.");
    }
  }

  return rows;
}

export function summarizeTebusBuku(rows: TebusBukuDraftRow[]): TebusBukuImportSummary {
  const sekolah = new Set<string>();
  let sudahTebus = 0;
  let sudahGuna = 0;
  for (const row of rows) {
    sekolah.add(row.schoolCode);
    if (row.sudahTebus) sudahTebus += 1;
    if (row.sudahGuna) sudahGuna += 1;
  }
  return { pelajar: rows.length, sekolah: sekolah.size, sudahTebus, sudahGuna };
}

const SERIAL_HEADER = "PPD,Kod,Nama Sekolah,Nama,Email,Tingkatan,Tebus,Guna";

/** CSV kecil untuk dihantar ke pelayan — rekod PPD MANJUNG sahaja. */
export function serializeManjungCsv(rows: TebusBukuDraftRow[]): string {
  const lines = [SERIAL_HEADER];
  for (const row of rows) {
    lines.push(
      [
        "PPD MANJUNG",
        csvCell(row.schoolCode),
        csvCell(row.schoolName),
        csvCell(row.nama),
        csvCell(row.email),
        csvCell(row.tingkatan),
        row.sudahTebus ? "Sudah Tebus" : "Belum Tebus",
        row.sudahGuna ? "Sudah Guna" : "Belum Guna",
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function withSourcedAt(rows: TebusBukuDraftRow[], sourcedAt: string): TebusBukuImportRow[] {
  return rows.map((row) => ({ ...row, sourcedAt }));
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Tarikh snapshot dari nama fail, cth. "26Ogos2026" atau "(21092026)". */
export function sourcedAtFromFilename(fileName: string): string | null {
  const compact = /(\d{1,2})\s*([A-Za-z]+)\s*(\d{4})/.exec(fileName);
  if (compact) {
    const month = MONTH_TOKENS[compact[2].toLowerCase()];
    if (month) {
      const iso = toIsoDate(Number(compact[3]), month, Number(compact[1]));
      if (iso) return iso;
    }
  }
  const ddmmyyyy = /\((\d{2})(\d{2})(\d{4})\)/.exec(fileName);
  if (ddmmyyyy) {
    return toIsoDate(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]), Number(ddmmyyyy[1]));
  }
  return null;
}

export function formatKualaLumpurDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
