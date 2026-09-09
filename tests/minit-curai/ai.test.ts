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

test("strips arrows, check marks and leftover symbols from AI point form", () => {
  assert.equal(normalizePointForm("Objektif drone → penerbitan\n✓ Pendaftaran peserta"), [
    "• Objektif drone penerbitan",
    "• Pendaftaran peserta",
  ].join("\n"));
  const items = parseMinitAiItems(JSON.stringify([{
    perkara: "Kursus drone → digital",
    keputusan: "✔ Diluluskan",
    tindakan: "Hebahan staf",
    pegawai: "PKG Sitiawan → USTP",
  }]));
  assert.ok(items);
  assert.equal(items[0].perkara, "• Kursus drone digital");
  assert.equal(items[0].keputusan, "• Diluluskan");
  assert.equal(items[0].pegawai, "PKG Sitiawan USTP");
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

test("defaults unnamed tindakan to Penolong PPD USTP Daerah Manjung", () => {
  const items = parseMinitAiItems(JSON.stringify([
    { perkara: "Dasar DPD", keputusan: "Laksana", tindakan: "Hebahan", pegawai: "Tidak dinyatakan" },
    { perkara: "Hebahan", keputusan: "Hantar", tindakan: "E-mel", pegawai: "" },
  ]));
  assert.ok(items);
  assert.equal(items.length, 2);
  assert.equal(items[0].pegawai, "Penolong PPD USTP Daerah Manjung");
  assert.equal(items[1].pegawai, "Penolong PPD USTP Daerah Manjung");
});

test("rejects empty or invalid AI payloads", () => {
  assert.equal(parseMinitAiItems(""), null);
  assert.equal(parseMinitAiItems("Tiada jadual"), null);
  assert.equal(parseMinitAiItems("[]"), null);
});
