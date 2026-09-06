"use server";

import { z } from "zod";
import { requireUser } from "@/lib/rbac";
import { generateGeminiText } from "@/lib/ai/gemini";
import { parseMinitAiItems } from "@/lib/minit-curai/ai";
import type { MinitCuraiItem } from "@/lib/schema";

export type JanaKandunganResult =
  | { ok: true; items: MinitCuraiItem[] }
  | { ok: false; error: string };

const inputSchema = z.object({
  notes: z.string().trim().min(1, "Sila tampal nota pegawai dahulu.").max(8000),
  tajuk: z.string().trim().max(500).optional().default(""),
  anjuran: z.string().trim().max(500).optional().default(""),
  chairperson: z.string().trim().max(200).optional().default(""),
  unitSektor: z.string().trim().max(200).optional().default(""),
  officers: z.array(z.string().trim().max(200)).max(40).optional().default([]),
});

const SYSTEM =
  "Anda pegawai USTP PPD Manjung yang menyusun minit curai rasmi. Tulis dalam Bahasa Melayu rasmi, padat dan profesional. Jangan cipta fakta, nama, tarikh atau keputusan yang tiada dalam nota.";

export async function janaKandunganMinit(raw: unknown): Promise<JanaKandunganResult> {
  await requireUser();
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Sila tampal nota pegawai dahulu." };
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

  const prompt = `Ubah nota pegawai di bawah menjadi jadual Kandungan minit curai. Nota mungkin dalam mana-mana bahasa; hasil mesti Bahasa Melayu rasmi.

${context ? `${context}\n\n` : ""}Nota pegawai:
${inp.notes}

Tugas:
- Pecahkan kepada 1 hingga 15 perkara berasingan (satu isu / keputusan / tindakan setiap objek).
- Setiap medan perkara, keputusan dan tindakan WAJIB point form: setiap ayat pada baris berasingan dan bermula dengan "• ".
- pegawai ialah nama atau unit bertanggungjawab. Jika tidak dinyatakan, guna "Tidak dinyatakan". Jangan cipta nama.
- Jangan ulang rumusan keseluruhan; hanya isi jadual.

Format jawapan (WAJIB): JSON array sahaja, tanpa markdown, tanpa ayat tambahan.
[{"perkara":"• ...","keputusan":"• ...","tindakan":"• ...","pegawai":"..."}]`;

  const generated = await generateGeminiText(prompt, {
    system: SYSTEM,
    maxOutputTokens: 3000,
    temperature: 0.3,
    timeoutMs: 30000,
  });
  if (!generated.ok) return generated;
  const items = parseMinitAiItems(generated.text);
  if (!items) {
    return { ok: false, error: "AI tidak dapat menyusun jadual. Semak nota atau cuba lagi." };
  }
  return { ok: true, items };
}
