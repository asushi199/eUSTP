import "server-only";

import { resolveGeminiModels, shouldFallbackGeminiStatus, thinkingConfigForModel } from "@/lib/ai/gemini-models";

/**
 * Klien ringkas Gemini (REST) — tiada SDK tambahan. Dipanggil hanya di sisi
 * pelayan; API key kekal dalam GEMINI_API_KEY (.env.local), tidak pernah
 * terdedah ke klien.
 *
 * Kuota percuma diasingkan mengikut model. Lalai: 3.8 → 3.5 → 2.5
 * (400/404/429/503 dan ralat lain kecuali 401 jatuh ke model seterusnya).
 */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiResult =
  | { ok: true; text: string; model: string }
  | { ok: false; error: string };

type GenerateOptions = {
  /** Arahan sistem (persona/tone). */
  system?: string;
  /** Had token output; default sederhana untuk perenggan pendek. */
  maxOutputTokens?: number;
  temperature?: number;
  /**
   * Belanjawan token "thinking" Gemini 2.5. Default 0 = matikan — kerana token
   * thinking dikira dalam maxOutputTokens dan boleh menyebabkan output benar
   * dipotong separuh jalan. -1 = dinamik.
   */
  thinkingBudget?: number;
  /** Had masa sisi-klien supaya UI tidak tergantung. */
  timeoutMs?: number;
  /** PDF/imej sebaris — tidak disimpan; hanya untuk slaid imbasan. */
  attachments?: Array<{ mimeType: string; bytes: Uint8Array }>;
};

function geminiModels() {
  return resolveGeminiModels();
}

export async function generateGeminiText(
  prompt: string,
  opts: GenerateOptions = {},
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY belum ditetapkan pada pelayan." };
  }

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  for (const file of opts.attachments ?? []) {
    if (!file.bytes.length) continue;
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: Buffer.from(file.bytes).toString("base64"),
      },
    });
  }

  const models = geminiModels();
  let last: GeminiResult = { ok: false, error: "Perkhidmatan AI tidak tersedia buat masa ini." };

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const hasNext = index < models.length - 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
    try {
      const generationConfig: Record<string, unknown> = {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxOutputTokens ?? 1024,
      };
      const thinking = thinkingConfigForModel(model, opts.thinkingBudget);
      if (thinking) generationConfig.thinkingConfig = thinking;

      const res = await fetch(
        `${GEMINI_ENDPOINT}/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            ...(opts.system
              ? { systemInstruction: { parts: [{ text: opts.system }] } }
              : {}),
            generationConfig,
          }),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[gemini] HTTP", res.status, model, detail.slice(0, 500));
        if (hasNext && shouldFallbackGeminiStatus(res.status)) {
          last = {
            ok: false,
            error: res.status === 429
              ? "Kuota AI harian/seminit telah dicapai. Cuba sebentar lagi."
              : "Perkhidmatan AI tidak tersedia buat masa ini.",
          };
          continue;
        }
        return {
          ok: false,
          error:
            res.status === 429
              ? "Kuota AI harian/seminit telah dicapai. Cuba sebentar lagi."
              : "Perkhidmatan AI tidak tersedia buat masa ini.",
        };
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
      };
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim();

      if (!text) {
        console.error("[gemini] respons kosong", model, JSON.stringify(data).slice(0, 500));
        last = { ok: false, error: "AI tidak menghasilkan teks. Cuba lagi." };
        if (!hasNext) return last;
        continue;
      }
      return { ok: true, text, model };
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      console.error("[gemini] ralat:", model, e instanceof Error ? e.message : e);
      last = {
        ok: false,
        error: aborted
          ? "AI mengambil masa terlalu lama. Cuba lagi."
          : "Sambungan ke perkhidmatan AI gagal.",
      };
      if (!hasNext) return last;
    } finally {
      clearTimeout(timer);
    }
  }

  return last;
}
