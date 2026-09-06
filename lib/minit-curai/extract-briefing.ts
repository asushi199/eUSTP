import JSZip from "jszip";
import { extractText } from "unpdf";

export const MINIT_AI_MAX_CHARS = 8000;
export const MINIT_AI_MAX_FILE_BYTES = 4 * 1024 * 1024;

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
    const text = clipBriefingText(raw);
    if (!text) {
      return {
        ok: false,
        error: "Fail ini nampaknya imej atau imbasan tanpa teks. Sila tampal nota atau muat naik fail yang ada teks.",
      };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, error: "Fail tidak dapat dibaca. Guna PDF atau PPTX, atau tampal nota." };
  }
}
