import "server-only";

/**
 * Klien ringkas Gemini (REST) — tiada SDK tambahan. Dipanggil hanya di sisi
 * pelayan; API key kekal dalam GEMINI_API_KEY (.env.local), tidak pernah
 * terdedah ke klien.
 *
 * Kuota percuma diasingkan mengikut model. Lalai: 3.5 Flash dahulu,
 * 429/404 baharu jatuh ke 2.5 Flash.
 */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiResult =
  | { ok: true; text: string }
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
  const primary = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const fallback = process.env.GEMINI_MODEL_FALLBACK || "gemini-2.5-flash";
  return [...new Set([primary, fallback].filter(Boolean))];
}

function thinkingConfig(model: string, budget?: number) {
  if (/gemini-3/i.test(model)) return { thinkingLevel: "minimal" };
  if (/gemini-2\.5/i.test(model)) return { thinkingBudget: budget ?? 0 };
  return null;
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
      const thinking = thinkingConfig(model, opts.thinkingBudget);
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
        if (hasNext && (res.status === 429 || res.status === 404)) {
          last = {
            ok: false,
            error: "Kuota AI harian/seminit telah dicapai. Cuba sebentar lagi.",
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
        return { ok: false, error: "AI tidak menghasilkan teks. Cuba lagi." };
      }
      return { ok: true, text };
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      console.error("[gemini] ralat:", model, e instanceof Error ? e.message : e);
      last = {
        ok: false,
        error: aborted
          ? "AI mengambil masa terlalu lama. Cuba lagi."
          : "Sambungan ke perkhidmatan AI gagal.",
      };
      if (!hasNext || aborted) return last;
    } finally {
      clearTimeout(timer);
    }
  }

  return last;
}
