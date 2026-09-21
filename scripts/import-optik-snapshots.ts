import "./load-env";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseOptikCsvText,
  parseOptikSpreadsheetBuffer,
  serializeOptikSchoolsCsv,
} from "../lib/analisis/optik-parse";

/**
 * Import snapshot AI Tools awal:
 * - Apr 2026 (Excel senarai guru)
 * - Sep 2026 (CSV paparan daerah)
 *
 * Guna: npm run db:import-optik
 */

const DATA_DIR = join(__dirname, "data");
const APRIL_XLSX =
  "c:\\Users\\asush.DESKTOP-5RJ4CT5\\Downloads\\38833FF26BA1D.UnigramPreview_g9c9v27vpyspw!App\\Analisis PLC AI Tools Daerah Manjung_ 20 April 2026.xlsx";
const CURRENT_CSV_DOWNLOAD =
  "c:\\Users\\asush.DESKTOP-5RJ4CT5\\Downloads\\Analisis PLC AI Tools Negeri Perak_Paparan Daerah V4_Table (1).csv";
const CURRENT_CSV_FALLBACK =
  "c:\\Users\\asush.DESKTOP-5RJ4CT5\\Downloads\\Analisis PLC AI Tools Negeri Perak_Paparan Daerah V4_Table.csv";

async function main() {
  const { insertOptikSnapshot, syncOptikCurrentMetrics, upsertOptikMetric } =
    await import("../lib/analisis/optik-store");

  const aprilCsvPath = join(DATA_DIR, "analisis-optik-2026-04-20.csv");
  const currentCsvPath = join(DATA_DIR, "analisis-optik-2026-09-21.csv");

  const aprilParsed = existsSync(APRIL_XLSX)
    ? parseOptikSpreadsheetBuffer(readFileSync(APRIL_XLSX))
    : parseOptikCsvText(readFileSync(aprilCsvPath, "utf8"));
  writeFileSync(aprilCsvPath, serializeOptikSchoolsCsv(aprilParsed.schools), "utf8");

  const currentSource = existsSync(CURRENT_CSV_DOWNLOAD)
    ? CURRENT_CSV_DOWNLOAD
    : existsSync(CURRENT_CSV_FALLBACK)
      ? CURRENT_CSV_FALLBACK
      : currentCsvPath;
  const currentParsed = parseOptikCsvText(readFileSync(currentSource, "utf8"));
  writeFileSync(currentCsvPath, serializeOptikSchoolsCsv(currentParsed.schools), "utf8");

  await upsertOptikMetric("kpi_year", "2026");
  await upsertOptikMetric("kpi_kebangsaan", "79");
  await upsertOptikMetric("tov_year", "2025");
  await upsertOptikMetric("tov", "86.43");
  await upsertOptikMetric("tov2025", "86.43");
  await upsertOptikMetric(
    "footer_note",
    "Titik pertama ialah TOV 2025 (86.43%, setakat 27 Nov 2025). Titik seterusnya mengikut setiap muat naik CSV tahun ini.",
  );
  await upsertOptikMetric(
    "source_url",
    "http://datastudio.google.com/u/2/reporting/359ac402-270f-48a6-a426-65a678267c5a/page/p_n3ao8p5l0d",
  );
  await upsertOptikMetric("source_label", "Buka sumber OPTIK / AI Tools");

  await insertOptikSnapshot({
    parsed: aprilParsed,
    capturedOn: "2026-04-20",
    chartLabel: "Apr 2026",
    filename: "Analisis PLC AI Tools Daerah Manjung_ 20 April 2026.xlsx",
    userId: null,
    makeCurrent: false,
  });
  console.log(
    `Apr 2026: ${aprilParsed.selesaiPct}% (${aprilParsed.selesaiBil}/${aprilParsed.totalBil}) guru=${aprilParsed.teachers.length}`,
  );

  await insertOptikSnapshot({
    parsed: currentParsed,
    capturedOn: "2026-09-21",
    chartLabel: "Sep 2026",
    filename: "Analisis PLC AI Tools Negeri Perak_Paparan Daerah V4_Table (1).csv",
    userId: null,
    makeCurrent: true,
  });
  await syncOptikCurrentMetrics("2026-09-21", currentParsed);
  console.log(
    `Sep 2026: ${currentParsed.selesaiPct}% (${currentParsed.selesaiBil}/${currentParsed.totalBil}) guru=${currentParsed.teachers.length}`,
  );

  console.log("Import AI Tools selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
