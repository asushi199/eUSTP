import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";
import type { EquipmentLoanDetail } from "./types";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "templates",
  "kew-pa-9-am24.pdf",
);
const ROWS_PER_PAGE = 20;
const ROW_HEIGHT = 17.16;
const TABLE_FIRST_ROW_TOP = 241.2;
const RETURN_NOTE_TOP = 241.13;
const RETURN_NOTE_LINE_HEIGHT = 6.4;
const RETURN_NOTE_VERTICAL_PADDING = 7;
const CATATAN_LEFT = 510.48;
const CATATAN_RIGHT = 562.44;
const TEMPLATE_GRID_LINE_WIDTH = 0.6;
const BLACK = rgb(0, 0, 0);

type KewPa9Unit = {
  serialNo: string;
  governmentAssetNo: string;
  description: string;
};

type KewPa9Signature = {
  name: string;
  position: string;
  date: string;
};

export type KewPa9SignatureDetails = {
  borrower: KewPa9Signature;
  approver: KewPa9Signature;
  returner: KewPa9Signature;
  receiver: KewPa9Signature;
};

export type KewPa9Data = {
  referenceNo: string;
  applicantName: string;
  position: string;
  orgName: string;
  purpose: string;
  usageLocation: string;
  /** Nama pegawai yang mengeluarkan aset (bukan pengeluar/jenama peralatan). */
  issuerName: string;
  borrowDate: string;
  expectedReturnDate: string;
  returnedAt: Date | null;
  returnNote: string;
  signatures: KewPa9SignatureDetails;
  units: KewPa9Unit[];
};

function safePdfText(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
}

function formatDate(value: string | Date | null): string {
  if (!value) return "";
  const date =
    typeof value === "string" ? new Date(`${value}T00:00:00+08:00`) : value;
  return new Intl.DateTimeFormat("ms-MY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(date);
}

export function buildKewPa9SignatureDetails(input: {
  applicantName: string;
  applicantPosition: string;
  borrowDate: string;
  approverName: string;
  approverPosition: string;
  approvedAt: Date | null;
  receiverName: string;
  receiverPosition: string;
  returnedAt: Date | null;
}): KewPa9SignatureDetails {
  const borrower = {
    name: input.applicantName,
    position: input.applicantPosition,
    date: formatDate(input.borrowDate),
  };
  const returner = input.returnedAt
    ? {
        name: input.applicantName,
        position: input.applicantPosition,
        date: formatDate(input.returnedAt),
      }
    : { name: "", position: "", date: "" };
  const receiver = input.returnedAt
    ? {
        name: input.receiverName,
        position: input.receiverPosition,
        date: formatDate(input.returnedAt),
      }
    : { name: "", position: "", date: "" };

  return {
    borrower,
    approver: {
      name: input.approverName,
      position: input.approverPosition,
      date: formatDate(input.approvedAt),
    },
    returner,
    receiver,
  };
}

function fitText(
  font: PDFFont,
  value: string,
  maxWidth: number,
  initialSize: number,
  minimumSize = 5.2,
): { text: string; size: number } {
  const text = safePdfText(value);
  let size = initialSize;
  while (size > minimumSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.2;
  }
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return { text, size };

  let shortened = text;
  while (
    shortened.length > 1 &&
    font.widthOfTextAtSize(`${shortened}...`, size) > maxWidth
  ) {
    shortened = shortened.slice(0, -1);
  }
  return { text: `${shortened}...`, size };
}

function drawCellText(
  page: PDFPage,
  font: PDFFont,
  value: string,
  x: number,
  top: number,
  width: number,
  size = 8.2,
) {
  const fitted = fitText(font, value, width, size);
  page.drawText(fitted.text, {
    x,
    y: page.getHeight() - top - fitted.size,
    size: fitted.size,
    font,
    color: BLACK,
  });
}

function coverTemplateText(
  page: PDFPage,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  page.drawRectangle({
    x: left,
    y: page.getHeight() - top - height,
    width,
    height,
    color: rgb(1, 1, 1),
  });
}

function drawCenteredCellText(
  page: PDFPage,
  font: PDFFont,
  value: string,
  left: number,
  top: number,
  width: number,
  size = 5.8,
) {
  const fitted = fitText(font, value, width - 4, size, 4.8);
  const textWidth = font.widthOfTextAtSize(fitted.text, fitted.size);
  page.drawText(fitted.text, {
    x: left + Math.max(2, (width - textWidth) / 2),
    y: page.getHeight() - top - fitted.size,
    size: fitted.size,
    font,
    color: BLACK,
  });
}

function wrapPdfText(
  font: PDFFont,
  value: string,
  maxWidth: number,
  size: number,
) {
  const words = safePdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);

    let remainder = word;
    while (font.widthOfTextAtSize(remainder, size) > maxWidth) {
      let end = remainder.length - 1;
      while (
        end > 1 &&
        font.widthOfTextAtSize(remainder.slice(0, end), size) > maxWidth
      ) {
        end -= 1;
      }
      lines.push(remainder.slice(0, end));
      remainder = remainder.slice(end);
    }
    line = remainder;
  }
  if (line) lines.push(line);
  return lines;
}

export function getReturnNoteBoxHeight(lineCount: number): number {
  const requiredHeight =
    Math.max(1, lineCount) * RETURN_NOTE_LINE_HEIGHT +
    RETURN_NOTE_VERTICAL_PADDING;
  const rowCount = Math.min(
    ROWS_PER_PAGE,
    Math.max(1, Math.ceil(requiredHeight / ROW_HEIGHT)),
  );
  return Number((rowCount * ROW_HEIGHT).toFixed(2));
}

export function getReturnNoteBox(lineCount: number) {
  return {
    left: CATATAN_LEFT,
    top: RETURN_NOTE_TOP,
    width: Number((CATATAN_RIGHT - CATATAN_LEFT).toFixed(2)),
    // Berhenti tepat sebelum garisan baris seterusnya supaya ia kekal sebagai sempadan bawah.
    height: Number(
      (getReturnNoteBoxHeight(lineCount) - TEMPLATE_GRID_LINE_WIDTH).toFixed(2),
    ),
  };
}

function drawReturnNote(
  page: PDFPage,
  font: PDFFont,
  value: string,
) {
  if (!value) return;

  const size = 5.2;
  const lines = wrapPdfText(font, value, CATATAN_RIGHT - CATATAN_LEFT - 4, size);
  const box = getReturnNoteBox(lines.length);
  page.drawRectangle({
    x: box.left,
    y: page.getHeight() - box.top - box.height,
    width: box.width,
    height: box.height,
    color: rgb(1, 1, 1),
  });

  const maxLines = Math.floor(
    (box.height - RETURN_NOTE_VERTICAL_PADDING + 1) / RETURN_NOTE_LINE_HEIGHT,
  );
  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && visibleLines.length > 0) {
    const last = visibleLines.length - 1;
    visibleLines[last] = fitText(
      font,
      `${visibleLines[last]}...`,
      box.width - 4,
      size,
    ).text;
  }
  visibleLines.forEach((line, index) => {
    page.drawText(line, {
      x: box.left + 2,
      y:
        page.getHeight() -
        box.top -
        4 -
        size -
        index * RETURN_NOTE_LINE_HEIGHT,
      size,
      font,
      color: BLACK,
    });
  });
}

function drawSignatureDetails(
  page: PDFPage,
  font: PDFFont,
  signature: KewPa9Signature,
  left: number,
  top: number,
  width: number,
  lineHeight: number,
) {
  drawCellText(page, font, signature.name, left, top, width, 7.2);
  drawCellText(page, font, signature.position, left, top + lineHeight, width, 7.2);
  drawCellText(page, font, signature.date, left, top + lineHeight * 2, width, 7.2);
}

function drawPageContent(
  page: PDFPage,
  font: PDFFont,
  data: KewPa9Data,
  units: KewPa9Unit[],
  pageIndex: number,
  pageCount: number,
) {
  coverTemplateText(page, 470, 87.5, 91, 12);
  drawCellText(
    page,
    font,
    pageCount > 1
      ? `${data.referenceNo} (${pageIndex + 1}/${pageCount})`
      : data.referenceNo,
    472,
    89,
    87,
    6.4,
  );
  drawCellText(page, font, data.applicantName, 161, 129, 154, 6.8);
  drawCellText(page, font, data.purpose, 410, 129, 149, 6.8);
  drawCellText(page, font, data.position, 161, 151, 154, 6.8);
  drawCellText(page, font, data.usageLocation, 410, 151, 149, 6.8);
  drawCellText(page, font, data.orgName, 161, 173, 154, 6.8);
  drawCellText(page, font, data.issuerName, 410, 173, 149, 6.8);

  const firstRowTop = 245.3;
  // Tarikh pemulangan hanya diisi selepas peralatan dipulangkan; kosong semasa pinjaman aktif.
  const returnedDate = formatDate(data.returnedAt);
  for (let index = 0; index < ROWS_PER_PAGE; index += 1) {
    coverTemplateText(
      page,
      42,
      TABLE_FIRST_ROW_TOP + index * ROW_HEIGHT,
      24,
      16.2,
    );
  }
  units.forEach((unit, index) => {
    const top = firstRowTop + index * ROW_HEIGHT;
    drawCenteredCellText(
      page,
      font,
      String(pageIndex * ROWS_PER_PAGE + index + 1),
      42,
      top,
      24,
    );
    drawCellText(
      page,
      font,
      unit.governmentAssetNo || unit.serialNo,
      69,
      top,
      86,
      5.8,
    );
    drawCellText(page, font, unit.description, 161, top, 109, 5.8);
    drawCenteredCellText(
      page,
      font,
      formatDate(data.borrowDate),
      274,
      top,
      44,
      5.6,
    );
    drawCenteredCellText(
      page,
      font,
      formatDate(data.expectedReturnDate),
      319,
      top,
      48,
      5.6,
    );
    drawCenteredCellText(page, font, "Lulus", 368, top, 39, 5.7);
    drawCenteredCellText(page, font, returnedDate, 408, top, 52, 5.6);
    drawCenteredCellText(page, font, returnedDate, 461, top, 49, 5.6);
    drawCellText(
      page,
      font,
      unit.governmentAssetNo ? `S/N ${unit.serialNo}` : "",
      512,
      top,
      48,
      5.3,
    );
  });
  if (pageIndex === 0) {
    drawReturnNote(page, font, data.returnNote);
  }
  if (pageIndex === pageCount - 1) {
    drawSignatureDetails(page, font, data.signatures.borrower, 82, 633, 230, 14);
    drawSignatureDetails(page, font, data.signatures.approver, 374, 633, 184, 14);
    drawSignatureDetails(page, font, data.signatures.returner, 82, 730, 230, 16.2);
    drawSignatureDetails(page, font, data.signatures.receiver, 374, 730, 184, 16.2);
  }
}

export function buildKewPa9Data(request: EquipmentLoanDetail): KewPa9Data {
  return {
    referenceNo: request.referenceNo,
    applicantName: request.applicantName,
    position: request.position,
    orgName: request.orgName,
    purpose: request.purpose,
    usageLocation: request.usageLocation,
    issuerName: request.issuerName,
    borrowDate: request.borrowDate,
    expectedReturnDate: request.expectedReturnDate,
    returnedAt: request.returnedAt,
    returnNote: request.returnNote,
    signatures: buildKewPa9SignatureDetails({
      applicantName: request.applicantName,
      applicantPosition: request.position,
      borrowDate: request.borrowDate,
      approverName: request.approverName,
      approverPosition: request.approverPosition,
      approvedAt: request.approvedAt,
      receiverName: request.receiverName,
      receiverPosition: request.receiverPosition,
      returnedAt: request.returnedAt,
    }),
    units: request.items.flatMap((item) =>
      item.allocatedUnits.map((unit) => ({
        serialNo: unit.serialNo,
        governmentAssetNo: unit.governmentAssetNo,
        description: unit.model || unit.typeName || item.categoryName,
      })),
    ),
  };
}

export async function generateKewPa9Pdf(
  data: KewPa9Data,
): Promise<Buffer> {
  if (data.units.length === 0) {
    throw new Error("Tiada unit diperuntukkan untuk dijana dalam KEW.PA-9.");
  }
  const templateBytes = await readFile(TEMPLATE_PATH);
  const template = await PDFDocument.load(templateBytes);
  const output = await PDFDocument.create();
  const font = await output.embedFont(StandardFonts.Helvetica);
  const chunks = Array.from(
    { length: Math.ceil(data.units.length / ROWS_PER_PAGE) },
    (_, index) =>
      data.units.slice(index * ROWS_PER_PAGE, (index + 1) * ROWS_PER_PAGE),
  );

  for (const [index, units] of chunks.entries()) {
    const [page] = await output.copyPages(template, [0]);
    output.addPage(page);
    drawPageContent(page, font, data, units, index, chunks.length);
  }

  output.setTitle(`KEW.PA-9 ${data.referenceNo}`);
  output.setSubject("Borang pergerakan/pinjaman aset alih (KEW.PA-9)");
  output.setCreator("NEXa Manjung");
  output.setProducer("NEXa Manjung");
  return Buffer.from(await output.save());
}
