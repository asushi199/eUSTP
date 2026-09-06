import assert from "node:assert/strict";
import test from "node:test";
import { normalizePointForm, parseMinitAiItems } from "../../lib/minit-curai/ai";

test("normalizes mixed bullets and numbered lines into point form", () => {
  assert.equal(normalizePointForm("Laksana minggu depan\n- Hebahan staf\n2) Semak takwim"), [
    "• Laksana minggu depan",
    "• Hebahan staf",
    "• Semak takwim",
  ].join("\n"));
});

test("parses fenced JSON and drops incomplete rows", () => {
  const items = parseMinitAiItems(`\`\`\`json
[
  {"perkara":"Dasar DPD","keputusan":"Laksana","tindakan":"Hebahan","pegawai":"PKG Sitiawan"},
  {"perkara":"","keputusan":"Tiada","tindakan":"Tiada","pegawai":"X"}
]
\`\`\``);
  assert.ok(items);
  assert.equal(items.length, 1);
  assert.equal(items[0].perkara, "• Dasar DPD");
  assert.equal(items[0].pegawai, "PKG Sitiawan");
});

test("rejects empty or invalid AI payloads", () => {
  assert.equal(parseMinitAiItems(""), null);
  assert.equal(parseMinitAiItems("Tiada jadual"), null);
  assert.equal(parseMinitAiItems("[]"), null);
});
