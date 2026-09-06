import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { MinitCurai } from "@/lib/schema";
import { formatMinitDate } from "./options";

const WIDTH = 595.28;
const HEIGHT = 841.89;
const LEFT = 40;
const RIGHT = WIDTH - LEFT;
const SIZE = 9;
const LINE = 13;
const BOTTOM = 52;
const BORDER = rgb(0.65, 0.65, 0.65);
const INK = rgb(0.08, 0.08, 0.08);
const FOG = rgb(0.94, 0.94, 0.94);

function pdfText(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").replace(/\u00a0/g, " ");
}

export function wrapMinitPdfText(font: PDFFont, value: string, width: number): string[] {
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

export async function generateMinitCuraiPdf(report: MinitCurai) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(`Minit Curai - ${report.tajuk}`);
  pdf.setAuthor(report.preparedByName);
  let page = pdf.addPage([WIDTH, HEIGHT]);
  let y = HEIGHT - 42;
  const columns = [LEFT, LEFT + 175, RIGHT];

  function draw(text: string, x: number, baseline: number, selectedFont = font, size = SIZE) {
    page.drawText(text, { x, y: baseline, font: selectedFont, size, color: INK });
  }
  function nextPage() {
    page = pdf.addPage([WIDTH, HEIGHT]);
    y = HEIGHT - 40;
    draw("BORANG MINIT CURAI (sambungan)", LEFT, y, bold, 11);
    y -= 22;
  }
  function ensure(height: number) {
    if (y - height < BOTTOM) nextPage();
  }
  function heading(title: string) {
    ensure(28);
    y -= 6;
    page.drawRectangle({ x: LEFT, y: y - 20, width: RIGHT - LEFT, height: 20, color: FOG });
    page.drawRectangle({ x: LEFT, y: y - 20, width: RIGHT - LEFT, height: 20, borderColor: BORDER, borderWidth: 0.5 });
    draw(title, LEFT + 8, y - 14, bold, 9);
    y -= 20;
  }
  function row(label: string, value: string) {
    const valueLines = wrapMinitPdfText(font, value || "-", columns[2] - columns[1] - 14);
    let labelLines = wrapMinitPdfText(bold, label, columns[1] - columns[0] - 14);
    let offset = 0;
    while (offset < valueLines.length) {
      const remaining = valueLines.length - offset;
      let capacity = Math.floor((y - BOTTOM - 16) / LINE);
      const wanted = Math.max(remaining, labelLines.length);
      if (capacity < Math.max(2, labelLines.length) || (wanted <= 40 && wanted > capacity)) {
        nextPage();
        capacity = Math.floor((y - BOTTOM - 16) / LINE);
      }
      const take = Math.min(remaining, capacity);
      const height = Math.max(take, labelLines.length) * LINE + 16;
      page.drawRectangle({ x: LEFT, y: y - height, width: RIGHT - LEFT, height, borderColor: BORDER, borderWidth: 0.5 });
      page.drawLine({ start: { x: columns[1], y }, end: { x: columns[1], y: y - height }, color: BORDER, thickness: 0.5 });
      labelLines.forEach((line, index) => draw(line, LEFT + 7, y - 16 - index * LINE, bold));
      valueLines.slice(offset, offset + take).forEach((line, index) => draw(line, columns[1] + 7, y - 16 - index * LINE));
      y -= height;
      offset += take;
      labelLines = wrapMinitPdfText(bold, `${label} (sambungan)`, columns[1] - columns[0] - 14);
    }
  }

  draw("BORANG MINIT CURAI", LEFT, y, bold, 14);
  y -= 16;
  draw("LAPORAN RINGKAS TAKLIMAT / MESYUARAT / KURSUS / BENGKEL", LEFT, y, bold, 9);
  y -= 18;

  heading("A. BUTIRAN LAPORAN");
  row("Nama pegawai / pelapor", report.reporterName);
  row("Jawatan / gred", report.reporterTitle);
  row("Unit / sektor", report.unitSektor);
  row("Tajuk", report.tajuk);
  row("Anjuran", report.anjuran);
  row("Tarikh / masa", `${formatMinitDate(report.meetingDate)} · ${report.meetingTime}`);
  row("Tempat / platform", report.tempat);
  row("Pengerusi / penyampai", report.chairperson);
  row("Rujukan / no. fail", report.rujukanFail || "-");

  heading("B. KANDUNGAN");
  report.items.forEach((item, index) => {
    row(`Perkara ${index + 1}`, item.perkara);
    row("Keputusan / penjelasan", item.keputusan);
    row("Tindakan susulan", item.tindakan);
    row("Pegawai / unit bertanggungjawab", item.pegawai);
  });

  heading("C. RUMUSAN & CATATAN PELAPOR");
  row("Rumusan / cadangan pelapor", report.rumusan);
  row("Lampiran / bahan diterima", report.lampiran || "-");
  row("Tarikh sasaran tindakan selesai", report.targetDate ? formatMinitDate(report.targetDate) : "-");

  heading("D. PENYEBARAN (CURAI) KEPADA STAF");
  row("Disebarkan kepada", report.disebarkanKepada);
  row("Tarikh curai kepada staf", formatMinitDate(report.tarikhCurai));
  row("Kaedah penyebaran", [
    report.kaedah.filter((item) => item !== "Lain-lain").join(", "),
    report.kaedahLain ? `Lain-lain: ${report.kaedahLain}` : "",
  ].filter(Boolean).join(" · ") || "-");

  heading("PENGESAHAN");
  row("Disediakan oleh", `${report.preparedByName}\n${report.preparedByTitle}\n${formatMinitDate(report.preparedAt)}`);
  row("Disemak / disahkan oleh", report.reviewedByName
    ? `${report.reviewedByName}\n${report.reviewedByTitle}\n${report.reviewedAt ? formatMinitDate(report.reviewedAt) : "-"}`
    : "-");

  ensure(36);
  y -= 16;
  const note = wrapMinitPdfText(
    font,
    "Nota: Minit curai hendaklah merekod perkara penting, keputusan, arahan dan tindakan susulan yang relevan, serta bukti penyebaran maklumat kepada staf berkaitan untuk rujukan dan tindakan.",
    RIGHT - LEFT,
  );
  note.forEach((line) => {
    ensure(LINE);
    draw(line, LEFT, y, font, 8);
    y -= 11;
  });

  const pages = pdf.getPages();
  pages.forEach((item, index) => item.drawText(`Muka surat ${index + 1} daripada ${pages.length}`, {
    x: LEFT, y: 28, font, size: 8, color: INK,
  }));
  return pdf.save();
}
