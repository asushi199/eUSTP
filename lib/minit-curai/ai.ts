import { MINIT_CURAI_TINDAKAN_BY } from "./options";
import type { MinitCuraiItem } from "@/lib/schema";

const MAX_ITEMS = 15;
const MAX_FIELD = 4000;
const MAX_PEGAWAI = 500;

/** Buang anak panah, tanda semak, emoji dan ZWSP; kekalkan Rumi + "• " sahaja. */
export function stripDecorativeSymbols(value: string) {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u2190-\u21FF\u27A1\u2794\u27F6]/g, " ")
    .replace(/[\u2713\u2714\u2717\u2718\u2610-\u2612\u2705\u274C]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[★☆●○◆■□▪▫]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizePointForm(value: string): string {
  const lines = value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => stripDecorativeSymbols(
      line.replace(/^[-*•–—]\s*/, "").replace(/^\d+[.)]\s*/, ""),
    ))
    .filter(Boolean);
  return lines.map((line) => `• ${line}`).join("\n");
}

function clip(value: string, max: number) {
  return value.length <= max ? value : value.slice(0, max);
}

export function parseMinitAiItems(raw: string): MinitCuraiItem[] | null {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const items: MinitCuraiItem[] = [];
  for (const row of parsed.slice(0, MAX_ITEMS)) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const perkara = normalizePointForm(String(record.perkara ?? ""));
    const keputusan = normalizePointForm(String(record.keputusan ?? ""));
    const tindakan = normalizePointForm(String(record.tindakan ?? ""));
    const rawPegawai = stripDecorativeSymbols(String(record.pegawai ?? "").replace(/\s+/g, " "));
    const unnamed = !rawPegawai || /^tidak dinyatakan$/i.test(rawPegawai);
    const pegawai = unnamed ? MINIT_CURAI_TINDAKAN_BY : rawPegawai;
    if (!perkara || !keputusan || !tindakan) continue;
    items.push({
      perkara: clip(perkara, MAX_FIELD),
      keputusan: clip(keputusan, MAX_FIELD),
      tindakan: clip(tindakan, MAX_FIELD),
      pegawai: clip(pegawai, MAX_PEGAWAI),
    });
  }
  return items.length ? items : null;
}
