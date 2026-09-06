import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { extractText } from "unpdf";

export const MINIT_AI_MAX_CHARS = 8000;
export const MINIT_AI_MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MINIT_AI_MIN_TEXT_CHARS = 80;
export const MINIT_AI_MAX_VISION_PAGES = 20;

export type GeminiAttachment = { mimeType: string; bytes: Uint8Array };

export type BriefingKind = "pdf" | "pptx";

export function detectBriefingKind(name: string, mime: string): BriefingKind | "ppt" | null {
  const fileName = name.toLowerCase();
  const type = mime.toLowerCase();
  if (type === "application/pdf" || fileName.endsWith(".pdf")) return "pdf";
  if (
    type === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    || fileName.endsWith(".pptx")
  ) return "pptx";
  if (type === "application/vnd.ms-powerpoint" || fileName.endsWith(".ppt")) return "ppt";
  return null;
}

export function clipBriefingText(value: string, max = MINIT_AI_MAX_CHARS) {
  const text = value.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text.length <= max ? text : `${text.slice(0, max)}\n…`;
}

export function combineBriefingNotes(notes: string, fileText: string) {
  return clipBriefingText([notes.trim(), fileText.trim()].filter(Boolean).join("\n\n"));
}

export function isSparseBriefingText(value: string) {
  return value.replace(/\s+/g, "").length < MINIT_AI_MIN_TEXT_CHARS;
}

export async function slicePdfForVision(bytes: Uint8Array, maxPages = MINIT_AI_MAX_VISION_PAGES) {
  const source = await PDFDocument.load(bytes);
  const count = Math.min(source.getPageCount(), maxPages);
  if (count < 1) throw new Error("empty pdf");
  if (count === source.getPageCount()) return bytes;
  const sliced = await PDFDocument.create();
  const pages = await sliced.copyPages(source, Array.from({ length: count }, (_, index) => index));
  for (const page of pages) sliced.addPage(page);
  return sliced.save();
}

async function extractPptxImages(bytes: Uint8Array, maxImages = MINIT_AI_MAX_VISION_PAGES) {
  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files)
    .filter((name) => /^ppt\/media\/.+\.(png|jpe?g|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const images: GeminiAttachment[] = [];
  for (const name of names) {
    const data = await zip.files[name].async("uint8array");
    if (data.length < 12_000) continue;
    const ext = name.split(".").pop()?.toLowerCase();
    const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    images.push({ mimeType, bytes: data });
    if (images.length >= maxImages) break;
  }
  return images;
}

function xmlText(xml: string) {
  return [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
    .map((match) => match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .trim())
    .filter(Boolean)
    .join("\n");
}

async function extractPptxText(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => (Number(/\d+/.exec(a)?.[0]) ?? 0) - (Number(/\d+/.exec(b)?.[0]) ?? 0));
  const chunks: string[] = [];
  for (const name of slideNames) {
    const xml = await zip.files[name].async("string");
    const text = xmlText(xml);
    if (text) chunks.push(text);
  }
  return chunks.join("\n\n");
}

async function extractPdfText(bytes: Uint8Array) {
  const { text } = await extractText(bytes, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : String(text ?? "");
}

export async function extractBriefingText(
  bytes: Uint8Array,
  kind: BriefingKind,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const raw = kind === "pdf" ? await extractPdfText(bytes) : await extractPptxText(bytes);
    return { ok: true, text: clipBriefingText(raw) };
  } catch {
    return { ok: false, error: "Fail tidak dapat dibaca. Guna PDF atau PPTX, atau tampal nota." };
  }
}

export async function prepareBriefingVision(
  bytes: Uint8Array,
  kind: BriefingKind,
): Promise<{ ok: true; attachments: GeminiAttachment[] } | { ok: false; error: string }> {
  try {
    if (kind === "pdf") {
      return { ok: true, attachments: [{ mimeType: "application/pdf", bytes: await slicePdfForVision(bytes) }] };
    }
    const images = await extractPptxImages(bytes);
    if (!images.length) {
      return {
        ok: false,
        error: "Slaid nampaknya imej tanpa teks yang boleh dibaca. Eksport sebagai PDF atau tampal nota.",
      };
    }
    return { ok: true, attachments: images };
  } catch {
    return { ok: false, error: "Fail imbasan tidak dapat dibaca. Cuba PDF yang lebih kecil atau tampal nota." };
  }
}
