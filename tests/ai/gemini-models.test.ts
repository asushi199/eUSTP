import assert from "node:assert/strict";
import test from "node:test";
import {
  labelGeminiModel,
  resolveGeminiModels,
  shouldFallbackGeminiStatus,
  thinkingConfigForModel,
} from "../../lib/ai/gemini-models";

test("defaults to 3.8 then 3.5 then 2.5", () => {
  assert.deepEqual(resolveGeminiModels({}), [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ]);
});

test("GEMINI_MODELS overrides the default chain", () => {
  assert.deepEqual(resolveGeminiModels({
    GEMINI_MODELS: "gemini-3.8-flash, gemini-2.5-flash, gemini-3.8-flash",
  }), ["gemini-3.8-flash", "gemini-2.5-flash"]);
});

test("maps 3.8 thinking to low and falls back on 400", () => {
  assert.deepEqual(thinkingConfigForModel("gemini-3.8-flash"), { thinkingLevel: "low" });
  assert.deepEqual(thinkingConfigForModel("gemini-3.5-flash"), { thinkingLevel: "minimal" });
  assert.equal(shouldFallbackGeminiStatus(400), true);
  assert.equal(shouldFallbackGeminiStatus(500), false);
});

test("labels model ids for staff", () => {
  assert.equal(labelGeminiModel("gemini-3.8-flash"), "Gemini 3.8 Flash");
  assert.equal(labelGeminiModel("gemini-2.5-flash"), "Gemini 2.5 Flash");
});
