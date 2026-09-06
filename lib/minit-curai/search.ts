export type MinitCuraiListItem = {
  id: string;
  tajuk: string;
  meetingDate: string;
  reporterName: string;
  unitSektor: string;
  anjuran: string;
  tempat: string;
};

export function normalizeMinitQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\-–—/.,:;()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function minitCuraiHaystack(report: MinitCuraiListItem): string {
  return normalizeMinitQuery(
    [
      report.tajuk,
      report.reporterName,
      report.unitSektor,
      report.anjuran,
      report.tempat,
      report.meetingDate,
    ].join(" "),
  );
}

export function filterMinitCurai<T extends MinitCuraiListItem>(
  reports: T[],
  query: string,
): T[] {
  const tokens = normalizeMinitQuery(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return reports;
  return reports.filter((report) => {
    const haystack = minitCuraiHaystack(report);
    return tokens.every((token) => haystack.includes(token));
  });
}
