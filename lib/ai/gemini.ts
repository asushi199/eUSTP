import "server-only";

/**
 * Klien ringkas Gemini (REST) — tiada SDK tambahan. Dipanggil hanya di sisi
 * pelayan; API key kekal dalam GEMINI_API_KEY (.env.local), tidak pernah
 * terdedah ke klien.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
  /** Had masa sisi-klien supaya UI tidak tergantung. */
  timeoutMs?: number;
};

export async function generateGeminiText(
  prompt: string,
  opts: GenerateOptions = {},
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY belum ditetapkan pada pelayan." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await fetch(
      `${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(opts.system
            ? { systemInstruction: { parts: [{ text: opts.system }] } }
            : {}),
          generationConfig: {
            temperature: opts.temperature ?? 0.7,
            maxOutputTokens: opts.maxOutputTokens ?? 800,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[gemini] HTTP", res.status, detail.slice(0, 500));
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
      console.error("[gemini] respons kosong", JSON.stringify(data).slice(0, 500));
      return { ok: false, error: "AI tidak menghasilkan teks. Cuba lagi." };
    }
    return { ok: true, text };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    console.error("[gemini] ralat:", e instanceof Error ? e.message : e);
    return {
      ok: false,
      error: aborted
        ? "AI mengambil masa terlalu lama. Cuba lagi."
        : "Sambungan ke perkhidmatan AI gagal.",
    };
  } finally {
    clearTimeout(timer);
  }
}
