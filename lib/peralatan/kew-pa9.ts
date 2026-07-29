import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";
import type {
  EquipmentDocumentStage,
  EquipmentLoanDetail,
  EquipmentLoanSignature,
  EquipmentSignatureStroke,
} from "./types";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "templates",
  "kew-pa-9-am24.pdf",
);
const ROWS_PER_PAGE = 20;
const BLACK = rgb(0, 0, 0);

type KewPa9Unit = {
  serialNo: string;
  governmentAssetNo: string;
  description: string;
};

export type KewPa9Data = {
  referenceNo: string;
  applicantName: string;
  position: string;
  orgName: string;
  purpose: string;
  usageLocation: string;
  manufacturer: string;
  borrowDate: string;
  expectedReturnDate: string;
  returnedAt: Date | null;
  units: KewPa9Unit[];
  signatures: EquipmentLoanSignature[];
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

function signatureByRole(
  signatures: EquipmentLoanSignature[],
  role: EquipmentLoanSignature["role"],
) {
  return signatures.find((signature) => signature.role === role);
}

function drawStrokes(
  page: PDFPage,
  strokes: EquipmentSignatureStroke[],
  left: number,
  top: number,
  width: number,
  height: number,
) {
  for (const stroke of strokes) {
    for (let index = 1; index < stroke.length; index += 1) {
      const from = stroke[index - 1];
      const to = stroke[index];
      page.drawLine({
        start: {
          x: left + from.x * width,
          y: page.getHeight() - (top + from.y * height),
        },
        end: {
          x: left + to.x * width,
          y: page.getHeight() - (top + to.y * height),
        },
        thickness: 1.15,
        color: BLACK,
      });
    }
  }
}

function drawSignature(
  page: PDFPage,
  font: PDFFont,
  signature: EquipmentLoanSignature | undefined,
  side: "left" | "right",
  row: "upper" | "lower",
) {
  if (!signature) return;
  const left = side === "left" ? 42.6 : 320.2;
  const valueX = side === "left" ? 82 : 373;
  const top = row === "upper" ? 586 : 681;
  const nameTop = row === "upper" ? 634 : 731.5;
  const width = 92;

  drawStrokes(page, signature.strokes, left + 2, top, width - 4, 24);
  drawCellText(page, font, signature.signerName, valueX, nameTop, 220, 6.2);
  drawCellText(
    page,
    font,
    signature.signerPosition,
    valueX,
    nameTop + (row === "upper" ? 13.8 : 16.2),
    220,
    6.0,
  );
  drawCellText(
    page,
    font,
    formatDate(signature.signedAt),
    valueX,
    nameTop + (row === "upper" ? 27.7 : 32.4),
    220,
    6.1,
  );
}

function drawPageContent(
  page: PDFPage,
  font: PDFFont,
  data: KewPa9Data,
  units: KewPa9Unit[],
  pageIndex: number,
  pageCount: number,
  stage: EquipmentDocumentStage,
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
  drawCellText(page, font, data.manufacturer, 410, 173, 149, 6.8);

  const firstRowTop = 245.3;
  const rowHeight = 17.16;
  const returnedDate = stage === "final" ? formatDate(data.returnedAt) : "";
  for (let index = 0; index < ROWS_PER_PAGE; index += 1) {
    coverTemplateText(page, 42, 241.2 + index * rowHeight, 24, 16.2);
  }
  units.forEach((unit, index) => {
    const top = firstRowTop + index * rowHeight;
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

  drawSignature(
    page,
    font,
    signatureByRole(data.signatures, "borrower"),
    "left",
    "upper",
  );
  drawSignature(
    page,
    font,
    signatureByRole(data.signatures, "approver"),
    "right",
    "upper",
  );
  if (stage === "final") {
    drawSignature(
      page,
      font,
      signatureByRole(data.signatures, "returner"),
      "left",
      "lower",
    );
    drawSignature(
      page,
      font,
      signatureByRole(data.signatures, "receiver"),
      "right",
      "lower",
    );
  }
}

export function buildKewPa9Data(request: EquipmentLoanDetail): KewPa9Data {
  const models = Array.from(
    new Set(request.items.map((item) => item.model.trim()).filter(Boolean)),
  );
  return {
    referenceNo: request.referenceNo,
    applicantName: request.applicantName,
    position: request.position,
    orgName: request.orgName,
    purpose: request.purpose,
    usageLocation: request.usageLocation,
    manufacturer:
      models.length === 1 ? models[0] : models.length > 1 ? "Pelbagai - rujuk aset" : "",
    borrowDate: request.borrowDate,
    expectedReturnDate: request.expectedReturnDate,
    returnedAt: request.returnedAt,
    units: request.items.flatMap((item) =>
      item.allocatedUnits.map((unit) => ({
        serialNo: unit.serialNo,
        governmentAssetNo: unit.governmentAssetNo,
        description: item.typeName,
      })),
    ),
    signatures: request.signatures,
  };
}

export async function generateKewPa9Pdf(
  data: KewPa9Data,
  stage: EquipmentDocumentStage,
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
    drawPageContent(page, font, data, units, index, chunks.length, stage);
  }

  output.setTitle(`KEW.PA-9 ${data.referenceNo}`);
  output.setSubject(
    stage === "final"
      ? "Borang pergerakan/pinjaman aset alih - lengkap"
      : "Borang pergerakan/pinjaman aset alih - serahan",
  );
  output.setCreator("eUSTP Manjung");
  output.setProducer("eUSTP Manjung");
  return Buffer.from(await output.save());
}
