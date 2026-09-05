import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { UstpReport } from "@/lib/schema";
import { formatUstpDate, formatUstpMoney, ustpPkgLabel } from "./options";
import { ustpTotalSen } from "./validation";

const WIDTH = 595.28;
const HEIGHT = 841.89;
const LEFT = 40;
const RIGHT = WIDTH - LEFT;
const SIZE = 9;
const LINE = 13;
const BOTTOM = 48;
const BORDER = rgb(0.65, 0.65, 0.65);
const INK = rgb(0.08, 0.08, 0.08);

function pdfText(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").replace(/\u00a0/g, " ");
}

/** Balut perkataan dan token panjang tanpa menggugurkan mana-mana baris. */
export function wrapUstpPdfText(font: PDFFont, value: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of pdfText(value).split("\n")) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      if (font.widthOfTextAtSize(line ? `${line} ${word}` : word, SIZE) <= width) {
        line = line ? `${line} ${word}` : word;
        continue;
      }
      if (line) { lines.push(line); line = ""; }
      for (const character of word) {
        if (line && font.widthOfTextAtSize(line + character, SIZE) > width) { lines.push(line); line = ""; }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function generateUstpPdf(report: UstpReport, photos: Uint8Array[]) {
  if (photos.length !== 2) throw new Error("Dua gambar diperlukan untuk PDF.");
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(`Laporan Program USTP - ${report.programName}`);
  pdf.setAuthor(report.preparedBy);
  let page = pdf.addPage([WIDTH, HEIGHT]);
  let y = HEIGHT - 40;
  const columns = [LEFT, LEFT + 28, LEFT + 183, RIGHT];

  function draw(text: string, x: number, baseline: number, selectedFont = font, size = SIZE) {
    page.drawText(text, { x, y: baseline, font: selectedFont, size, color: INK });
  }
  function grid(top: number, height: number) {
    page.drawRectangle({ x: LEFT, y: top - height, width: RIGHT - LEFT, height, borderColor: BORDER, borderWidth: 0.5 });
    for (const x of columns.slice(1, -1)) page.drawLine({ start: { x, y: top }, end: { x, y: top - height }, color: BORDER, thickness: 0.5 });
  }
  function tableHeader() {
    page.drawRectangle({ x: LEFT, y: y - 24, width: RIGHT - LEFT, height: 24, color: rgb(0.94, 0.94, 0.94) });
    grid(y, 24);
    draw("BIL.", LEFT + 4, y - 16, bold, 8);
    draw("PERKARA", columns[1] + 7, y - 16, bold);
    draw("KETERANGAN", columns[2] + 7, y - 16, bold);
    y -= 24;
  }
  function nextPage() {
    page = pdf.addPage([WIDTH, HEIGHT]); y = HEIGHT - 40;
    draw("LAPORAN PROGRAM USTP", LEFT, y, bold, 11);
    y -= 23; tableHeader();
  }
  function row(number: number | string, label: string, value: string) {
    const valueLines = wrapUstpPdfText(font, value || "-", columns[3] - columns[2] - 14);
    let labelLines = wrapUstpPdfText(bold, label, columns[2] - columns[1] - 14);
    let offset = 0;
    while (offset < valueLines.length) {
      const remaining = valueLines.length - offset;
      let capacity = Math.floor((y - BOTTOM - 16) / LINE);
      const wanted = Math.max(remaining, labelLines.length);
      if (capacity < Math.max(2, labelLines.length) || (wanted <= 50 && wanted > capacity)) { nextPage(); capacity = Math.floor((y - BOTTOM - 16) / LINE); }
      const take = Math.min(remaining, capacity);
      const height = Math.max(take, labelLines.length) * LINE + 16;
      grid(y, height);
      draw(String(number), LEFT + 7, y - 16);
      labelLines.forEach((line, index) => draw(line, columns[1] + 7, y - 16 - index * LINE, bold));
      valueLines.slice(offset, offset + take).forEach((line, index) => draw(line, columns[2] + 7, y - 16 - index * LINE));
      y -= height; offset += take;
      labelLines = wrapUstpPdfText(bold, `${label} (sambungan)`, columns[2] - columns[1] - 14);
    }
  }

  const header = await pdf.embedJpg(await readFile(path.join(process.cwd(), "public/templates/laporan-ustp-header.jpg")));
  const headerSize = header.scaleToFit(RIGHT - LEFT, 120);
  page.drawImage(header, { x: LEFT, y: y - headerSize.height, ...headerSize });
  y -= headerSize.height + 22;
  draw("NEGERI: Perak", LEFT, y, bold); y -= 16;
  draw("SSTP/USTP: Manjung", LEFT, y, bold); y -= 16;
  draw(`PKG: ${ustpPkgLabel(report.pkgCode)}`, LEFT, y, bold); y -= 22;
  tableHeader();
  row(1, "KLUSTER PROGRAM/AKTIVITI", report.cluster);
  row(2, "AKTIVITI/PROGRAM", report.programName);
  row(3, "TARIKH", `${formatUstpDate(report.startDate)} - ${formatUstpDate(report.endDate)}`);
  row(4, "TEMPAT", report.location);
  row(5, "PENGANJUR", report.organiser);
  row(6, "BIL. SEKOLAH TERLIBAT", String(report.schoolCount));
  row(7, "BIL. PEGAWAI/GURU TERLIBAT", String(report.teacherCount));
  row(8, "BIL. MURID TERLIBAT", String(report.studentCount));
  row(9, "BIL. KOMUNITI TERLIBAT", String(report.communityCount));
  row(10, "TERAS DALAM DPD", report.teras.join(", "));
  row(11, "OBJEKTIF AKTIVITI", report.objectives);
  row(12, "PENGGUNAAN PERALATAN CoE", report.equipmentUsed === "Ya" ? `Ya\n${report.equipment.join("\n")}` : "Tidak");
  row(13, "PERUNTUKAN YANG DIGUNAKAN", `OS21000: RM${formatUstpMoney(report.os21000Sen)}\nOS29000: RM${formatUstpMoney(report.os29000Sen)}\nOS42000: RM${formatUstpMoney(report.os42000Sen)}`);
  row(14, "PERUNTUKAN LAIN", `${report.otherAllocation || "Tiada"}\nRM${formatUstpMoney(report.otherSen)}`);
  row(15, "JUMLAH (RM)", formatUstpMoney(ustpTotalSen(report)));
  row(16, "REFLEKSI", report.reflection);

  if (y - 235 < BOTTOM) nextPage();
  row(17, "GAMBAR", "Gambar program");
  const photoWidth = (RIGHT - LEFT - 30) / 2;
  const photoHeight = 160;
  for (let index = 0; index < 2; index++) {
    const bytes = photos[index];
    const embedded = bytes[0] === 0xff && bytes[1] === 0xd8 ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
    const scaled = embedded.scaleToFit(photoWidth, photoHeight);
    const x = LEFT + 10 + index * (photoWidth + 10);
    page.drawImage(embedded, { x: x + (photoWidth - scaled.width) / 2, y: y - 10 - photoHeight + (photoHeight - scaled.height) / 2, width: scaled.width, height: scaled.height });
    draw(`Gambar ${index + 1}`, x, y - photoHeight - 25);
  }
  page.drawRectangle({ x: LEFT, y: y - 195, width: RIGHT - LEFT, height: 195, borderColor: BORDER, borderWidth: 0.5 });
  y -= 195;
  row("", "DISEDIAKAN OLEH", report.preparedBy);

  const pages = pdf.getPages();
  pages.forEach((item, index) => item.drawText(`Muka surat ${index + 1} daripada ${pages.length}`, { x: LEFT, y: 25, font, size: 8, color: INK }));
  return pdf.save();
}
