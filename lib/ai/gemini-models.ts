export const DEFAULT_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
] as const;

export function resolveGeminiModels(env: Record<string, string | undefined> = process.env) {
  const listed = env.GEMINI_MODELS?.split(",").map((item) => item.trim()).filter(Boolean);
  if (listed?.length) return [...new Set(listed)];
  return [...DEFAULT_GEMINI_MODELS];
}

export function thinkingConfigForModel(model: string, budget?: number) {
  if (/gemini-3\.8/i.test(model)) return { thinkingLevel: "low" };
  if (/gemini-3/i.test(model)) return { thinkingLevel: "minimal" };
  if (/gemini-2\.5/i.test(model)) return { thinkingBudget: budget ?? 0 };
  return null;
}

export function shouldFallbackGeminiStatus(status: number) {
  return status !== 401;
}

export function labelGeminiModel(model: string) {
  const parts = model.replace(/^gemini-/i, "").split("-").filter(Boolean);
  if (parts.length < 2) return model;
  const [version, ...rest] = parts;
  const suffix = rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  return `Gemini ${version} ${suffix}`;
}
