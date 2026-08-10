import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";
import type { EquipmentTransferBatchDetail } from "./types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const ROWS_PER_PAGE = 6;
const BLACK = rgb(0, 0, 0);

function safePdfText(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(value);
}

function assetAge(
  unit: EquipmentTransferBatchDetail["units"][number],
  movedAt: Date,
): string {
  if (unit.acquisitionDate) {
    const acquiredYear = Number(unit.acquisitionDate.slice(0, 4));
    const movedYear = Number(
      new Intl.DateTimeFormat("en", {
        year: "numeric",
        timeZone: "Asia/Kuala_Lumpur",
      }).format(movedAt),
    );
    return `${Math.max(0, movedYear - acquiredYear)} tahun`;
  }
  if (unit.acquisitionYear) {
    const movedYear = Number(
      new Intl.DateTimeFormat("en", {
        year: "numeric",
        timeZone: "Asia/Kuala_Lumpur",
      }).format(movedAt),
    );
    return `${Math.max(0, movedYear - unit.acquisitionYear)} tahun`;
  }
  return "";
}

function fitText(font: PDFFont, value: string, width: number, size: number) {
  const text = safePdfText(value);
  let fittedSize = size;
  while (fittedSize > 5 && font.widthOfTextAtSize(text, fittedSize) > width) {
    fittedSize -= 0.2;
  }
  if (font.widthOfTextAtSize(text, fittedSize) <= width) {
    return { text, size: fittedSize };
  }

  let shortened = text;
  while (
    shortened.length > 1 &&
    font.widthOfTextAtSize(`${shortened}...`, fittedSize) > width
  ) {
    shortened = shortened.slice(0, -1);
  }
  return { text: `${shortened}...`, size: fittedSize };
}

function drawText(
  page: PDFPage,
  font: PDFFont,
  value: string,
  x: number,
  y: number,
  width: number,
  size: number,
  align: "left" | "center" = "left",
) {
  const fitted = fitText(font, value, width, size);
  const textWidth = font.widthOfTextAtSize(fitted.text, fitted.size);
  page.drawText(fitted.text, {
    x: align === "center" ? x + Math.max(0, (width - textWidth) / 2) : x,
    y,
    size: fitted.size,
    font,
    color: BLACK,
  });
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.55, color: BLACK });
}

function drawHeader(page: PDFPage, font: PDFFont, data: EquipmentTransferBatchDetail) {
  drawText(page, font, "Pekeliling Perbendaharaan Malaysia", MARGIN, 806, 250, 8);
  drawText(page, font, "AM 2.6 Lampiran A", 390, 806, 163, 8, "center");
  drawText(page, font, "KEW.PA-17", MARGIN, 773, PAGE_WIDTH - MARGIN * 2, 12, "center");
  drawText(page, font, `No. Permohonan : ${data.referenceNo}`, MARGIN, 745, 270, 8.5);
  drawText(page, font, "BORANG PINDAHAN ASET ALIH", MARGIN, 712, PAGE_WIDTH - MARGIN * 2, 11, "center");
}

function drawAssetTable(
  page: PDFPage,
  font: PDFFont,
  data: EquipmentTransferBatchDetail,
  units: EquipmentTransferBatchDetail["units"],
  pageIndex: number,
) {
  const left = MARGIN;
  const top = 686;
  const widths = [28, 164, 94, 101, 58, 66];
  const headerHeight = 42;
  const rowHeight = 32;
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const tableBottom = top - headerHeight - ROWS_PER_PAGE * rowHeight;
  drawLine(page, left, top, left + totalWidth, top);
  drawLine(page, left, top - headerHeight, left + totalWidth, top - headerHeight);
  for (let row = 1; row <= ROWS_PER_PAGE; row += 1) {
    drawLine(page, left, top - headerHeight - row * rowHeight, left + totalWidth, top - headerHeight - row * rowHeight);
  }
  let cursor = left;
  [left, ...widths].forEach((width, index) => {
    if (index > 0) cursor += width;
    drawLine(page, cursor, top, cursor, tableBottom);
  });

  const headers = [
    "Bil.",
    "Keterangan Aset",
    "No. Siri Pendaftaran",
    "No. Siri Pembuat/No. Pendaftaran Kenderaan",
    "Usia Guna Aset",
    "Catatan",
  ];
  let headerX = left;
  headers.forEach((header, index) => {
    drawText(page, font, header, headerX + 2, top - 25, widths[index] - 4, 5.7, "center");
    headerX += widths[index];
  });

  units.forEach((unit, index) => {
    const y = top - headerHeight - 20 - index * rowHeight;
    let cellX = left;
    const description = [unit.typeName, unit.model].filter(Boolean).join(" - ");
    const values = [
      String(pageIndex * ROWS_PER_PAGE + index + 1),
      description,
      unit.governmentAssetNo,
      unit.serialNo,
      assetAge(unit, data.movedAt),
      data.notes,
    ];
    values.forEach((value, valueIndex) => {
      drawText(
        page,
        font,
        value,
        cellX + 2,
        y,
        widths[valueIndex] - 4,
        6.4,
        valueIndex === 0 ? "center" : "left",
      );
      cellX += widths[valueIndex];
    });
  });
}

function drawSignatureBlock(
  page: PDFPage,
  font: PDFFont,
  label: string,
  name: string,
  position: string,
  x: number,
  top: number,
  width: number,
  date: string,
) {
  drawLine(page, x, top - 3, x + width, top - 3);
  drawText(page, font, `(Tandatangan ${label})`, x, top - 16, width, 7.5, "center");
  drawText(page, font, `Nama : ${name}`, x, top - 38, width, 8);
  drawText(page, font, `Jawatan : ${position}`, x, top - 53, width, 8);
  drawText(page, font, `Tarikh : ${date}`, x, top - 68, width, 8);
}

function drawSignatures(page: PDFPage, font: PDFFont, data: EquipmentTransferBatchDetail) {
  const date = formatDate(data.movedAt);
  const left = MARGIN;
  const width = 230;
  drawSignatureBlock(page, font, "Pemohon", data.applicantName, data.applicantPosition, left, 392, width, date);
  drawSignatureBlock(page, font, "Pelulus", data.approverName, data.approverPosition, 323, 392, width, date);
  drawText(page, font, "Dengan ini saya menyerahkan aset yang dinyatakan di atas.", left, 274, width, 8);
  drawText(page, font, "Dengan ini saya menerima aset yang dinyatakan di atas.", 323, 274, width, 8);
  drawSignatureBlock(page, font, "Penyerah", data.senderName, data.senderPosition, left, 240, width, date);
  drawSignatureBlock(page, font, "Penerima", data.receiverName, data.receiverPosition, 323, 240, width, date);
}

export function buildKewPa17Data(
  transfer: EquipmentTransferBatchDetail,
): EquipmentTransferBatchDetail {
  return transfer;
}

export async function generateKewPa17Pdf(
  data: EquipmentTransferBatchDetail,
): Promise<Buffer> {
  if (data.units.length === 0) {
    throw new Error("Tiada unit dipindahkan untuk dijana dalam KEW.PA-17.");
  }
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const chunks = Array.from(
    { length: Math.ceil(data.units.length / ROWS_PER_PAGE) },
    (_, index) => data.units.slice(index * ROWS_PER_PAGE, (index + 1) * ROWS_PER_PAGE),
  );

  chunks.forEach((units, pageIndex) => {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page, font, data);
    drawAssetTable(page, font, data, units, pageIndex);
    if (pageIndex === chunks.length - 1) drawSignatures(page, font, data);
  });

  pdf.setTitle(`KEW.PA-17 ${data.referenceNo}`);
  pdf.setSubject("Borang pindahan aset alih (KEW.PA-17)");
  pdf.setCreator("NEXa Manjung");
  pdf.setProducer("NEXa Manjung");
  return Buffer.from(await pdf.save());
}
