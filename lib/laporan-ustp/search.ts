import { ustpPkgLabel } from "@/lib/laporan-ustp/options";

export type UstpReportListItem = {
  id: string;
  programName: string;
  pkgCode: string;
  startDate: string;
  endDate: string;
  preparedBy: string;
  location?: string;
  organiser?: string;
  cluster?: string;
};

export function normalizeUstpQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\-–—/.,:;()[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ustpReportHaystack(report: UstpReportListItem): string {
  return normalizeUstpQuery(
    [
      report.programName,
      report.pkgCode,
      ustpPkgLabel(report.pkgCode),
      report.preparedBy,
      report.location ?? "",
      report.organiser ?? "",
      report.cluster ?? "",
      report.startDate,
      report.endDate,
    ].join(" "),
  );
}

export function filterUstpReports<T extends UstpReportListItem>(
  reports: T[],
  query: string,
): T[] {
  const tokens = normalizeUstpQuery(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return reports;
  return reports.filter((report) => {
    const haystack = ustpReportHaystack(report);
    return tokens.every((token) => haystack.includes(token));
  });
}
