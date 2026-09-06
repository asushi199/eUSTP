"use server";

import { z } from "zod";
import { requireUser } from "@/lib/rbac";
import { generateGeminiText } from "@/lib/ai/gemini";
import { parseMinitAiItems } from "@/lib/minit-curai/ai";
import {
  MINIT_AI_MAX_CHARS,
  MINIT_AI_MAX_FILE_BYTES,
  MINIT_AI_MAX_VISION_PAGES,
  combineBriefingNotes,
  detectBriefingKind,
  extractBriefingText,
  isSparseBriefingText,
  prepareBriefingVision,
  type GeminiAttachment,
} from "@/lib/minit-curai/extract-briefing";
import type { MinitCuraiItem } from "@/lib/schema";

export type JanaKandunganResult =
  | { ok: true; items: MinitCuraiItem[] }
  | { ok: false; error: string };

const metaSchema = z.object({
  notes: z.string().trim().max(MINIT_AI_MAX_CHARS).optional().default(""),
  tajuk: z.string().trim().max(500).optional().default(""),
  anjuran: z.string().trim().max(500).optional().default(""),
  chairperson: z.string().trim().max(200).optional().default(""),
  unitSektor: z.string().trim().max(200).optional().default(""),
  officers: z.array(z.string().trim().max(200)).max(40).optional().default([]),
});

const SYSTEM =
  "Anda pegawai USTP PPD Manjung yang menyusun minit curai rasmi. Tulis dalam Bahasa Melayu rasmi, padat dan profesional. Jangan cipta fakta, nama, tarikh atau keputusan yang tiada dalam nota atau slaid.";

function textField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function officersFrom(form: FormData) {
  try {
    const parsed = JSON.parse(textField(form, "officers") || "[]");
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

async function sourceFrom(form: FormData) {
  const notes = textField(form, "notes");
  const file = form.get("fail");
  if (!(file instanceof File) || file.size === 0) {
    return notes.trim()
      ? { ok: true as const, notes: notes.trim(), attachments: [] as GeminiAttachment[] }
      : { ok: false as const, error: "Sila tampal nota atau muat naik PDF/PPTX dahulu." };
  }
  if (file.size > MINIT_AI_MAX_FILE_BYTES) {
    return { ok: false as const, error: "Fail terlalu besar (maksimum 4MB). Ringkaskan atau tampal nota." };
  }
  const kind = detectBriefingKind(file.name, file.type);
  if (kind === "ppt") {
    return { ok: false as const, error: "Fail .ppt lama tidak disokong. Simpan sebagai PDF atau PPTX." };
  }
  if (!kind) {
    return { ok: false as const, error: "Hanya PDF atau PPTX diterima." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extracted = await extractBriefingText(bytes, kind);
  if (!extracted.ok) return extracted;
  const combined = combineBriefingNotes(notes, extracted.text);
  if (!isSparseBriefingText(combined)) {
    return { ok: true as const, notes: combined, attachments: [] as GeminiAttachment[] };
  }
  const vision = await prepareBriefingVision(bytes, kind);
  if (!vision.ok) {
    return combined
      ? { ok: true as const, notes: combined, attachments: [] as GeminiAttachment[] }
      : vision;
  }
  return {
    ok: true as const,
    notes: combined || "(Fail imbasan / slaid imej — baca kandungan dalam fail.)",
    attachments: vision.attachments,
  };
}

export async function janaKandunganMinit(form: FormData): Promise<JanaKandunganResult> {
  await requireUser();
  const source = await sourceFrom(form);
  if (!source.ok) return source;
  const parsed = metaSchema.safeParse({
    notes: source.notes,
    tajuk: textField(form, "tajuk"),
    anjuran: textField(form, "anjuran"),
    chairperson: textField(form, "chairperson"),
    unitSektor: textField(form, "unitSektor"),
    officers: officersFrom(form),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Sila semak nota atau fail." };
  }
  const inp = parsed.data;
  const officers = inp.officers.filter(Boolean).join("; ") || "(Tiada senarai pegawai)";
  const context = [
    inp.tajuk ? `Tajuk: ${inp.tajuk}` : null,
    inp.anjuran ? `Anjuran: ${inp.anjuran}` : null,
    inp.chairperson ? `Pengerusi / penyampai: ${inp.chairperson}` : null,
    inp.unitSektor ? `Unit pelapor: ${inp.unitSektor}` : null,
    `Pegawai yang mungkin relevan: ${officers}`,
  ].filter(Boolean).join("\n");
  const scanned = source.attachments.length > 0;

  const prompt = `Ubah nota/fail taklimat di bawah menjadi jadual Kandungan minit curai. Sumber mungkin dalam mana-mana bahasa; hasil mesti Bahasa Melayu rasmi.
${scanned ? `\nFail dilampirkan ialah slaid/PDF imbasan. Baca teks dalam imej (maksimum ${MINIT_AI_MAX_VISION_PAGES} halaman/slaid pertama).\n` : ""}
${context ? `${context}\n\n` : ""}Nota / teks fail:
${inp.notes}

Tugas:
- WAJIB pecahkan kepada beberapa perkara berasingan jika ada lebih daripada satu isu, keputusan atau tindakan (1 hingga 15 objek).
- Jangan gabungkan semua isu dalam satu perkara. Satu isu / keputusan / tindakan = satu objek.
- Setiap medan perkara, keputusan dan tindakan WAJIB point form: setiap ayat pada baris berasingan dan bermula dengan "• ".
- pegawai ialah nama atau unit bertanggungjawab. Jika tidak dinyatakan, guna "Tidak dinyatakan". Jangan cipta nama.
- Jangan ulang rumusan keseluruhan; hanya isi jadual.

Format jawapan (WAJIB): JSON array sahaja, tanpa markdown, tanpa ayat tambahan.
[{"perkara":"• ...","keputusan":"• ...","tindakan":"• ...","pegawai":"..."}]`;

  const generated = await generateGeminiText(prompt, {
    system: SYSTEM,
    maxOutputTokens: 3000,
    temperature: 0.3,
    timeoutMs: scanned ? 45000 : 30000,
    attachments: source.attachments,
  });
  if (!generated.ok) return generated;
  const items = parseMinitAiItems(generated.text);
  if (!items) {
    return { ok: false, error: "AI tidak dapat menyusun jadual. Semak nota/fail atau cuba lagi." };
  }
  return { ok: true, items };
}
