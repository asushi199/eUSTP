export type NamedSchool = {
  code: string;
  name: string;
};

export type SchoolLineMatch =
  | { query: string; status: "matched"; school: NamedSchool }
  | { query: string; status: "ambiguous"; schools: NamedSchool[] }
  | { query: string; status: "unmatched" };

const TYPE_WORDS = new Set([
  "SK",
  "SMK",
  "SJKC",
  "SJKT",
  "SABK",
  "SM",
  "SBP",
  "KV",
  "SEKOLAH",
  "KEBANGSAAN",
  "MENENGAH",
  "JENIS",
  "CINA",
  "TAMIL",
  "DAN",
  "THE",
  "OF",
]);

/** Pecahkan teks kepada baris sekolah; baris kosong diabaikan. */
export function parseSchoolListQuery(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Lebih daripada satu baris = senarai tampalan, bukan carian biasa. */
export function isSchoolListQuery(raw: string): boolean {
  return parseSchoolListQuery(raw).length > 1;
}

export function normalizeSchoolLookup(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/[’‘`]/g, "'")
    .replace(/^SEKOLAH KEBANGSAAN\s+/, "SK ")
    .replace(/^SEKOLAH MENENGAH KEBANGSAAN\s+/, "SMK ")
    .replace(/^SEKOLAH JENIS KEBANGSAAN\s*\(?\s*CINA\s*\)?\s+/i, "SJKC ")
    .replace(/^SEKOLAH JENIS KEBANGSAAN\s*\(?\s*TAMIL\s*\)?\s+/i, "SJKT ")
    .replace(/^SJK\s*\(\s*C\s*\)\s*/i, "SJKC ")
    .replace(/^SJK\s*\(\s*T\s*\)\s*/i, "SJKT ")
    .replace(/^SJK C\s+/i, "SJKC ")
    .replace(/^SJK T\s+/i, "SJKT ")
    .replace(/^(SMK|SJKC|SJKT|SK|SM|SBP|SABK)\.\s*/, "$1 ")
    .replace(/[.,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(normalized: string): string[] {
  return normalized.split(/\s+/).filter((token) => token && !TYPE_WORDS.has(token));
}

function scoreSchool(queryNorm: string, school: NamedSchool): number {
  const nameNorm = normalizeSchoolLookup(school.name);
  const codeNorm = school.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const queryCode = queryNorm.replace(/[^A-Z0-9]/g, "");

  if (queryCode && queryCode === codeNorm) return 100;
  if (queryNorm === nameNorm) return 95;

  const queryTokens = significantTokens(queryNorm);
  const nameTokens = significantTokens(nameNorm);
  if (queryTokens.length === 0) return 0;

  const nameWords = new Set(nameNorm.split(/\s+/).filter(Boolean));
  const allPresent = queryTokens.every((token) => nameWords.has(token));
  if (!allPresent) {
    const queryCore = queryTokens.join(" ");
    const nameCore = nameTokens.join(" ");
    if (nameCore.includes(queryCore) || queryCore.includes(nameCore)) return 75;
    return 0;
  }

  if (queryTokens.join(" ") === nameTokens.join(" ")) return 90;
  return Math.max(50, 80 - Math.max(0, nameTokens.length - queryTokens.length) * 5);
}

/** Padankan setiap baris kepada sekolah rasmi. Nama pendek/panjang dan kod sekolah diterima. */
export function matchSchoolLines(queries: string[], schools: NamedSchool[]): SchoolLineMatch[] {
  return queries.map((query) => {
    const queryNorm = normalizeSchoolLookup(query);
    const scored = schools
      .map((school) => ({ school, score: scoreSchool(queryNorm, school) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name, "ms"));

    if (scored.length === 0) return { query, status: "unmatched" };

    const best = scored[0].score;
    const top = scored.filter((row) => row.score === best).map((row) => row.school);
    if (top.length === 1) return { query, status: "matched", school: top[0] };
    return { query, status: "ambiguous", schools: top };
  });
}
