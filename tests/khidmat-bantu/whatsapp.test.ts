import assert from "node:assert/strict";
import test from "node:test";
import { buildKhidmatDecisionWhatsAppUrl } from "../../lib/khidmat-bantu/whatsapp";

const details = {
  applicantName: "Siti Aminah",
  orgName: "SK Contoh",
  serviceLabel: "Ceramah",
  title: "Literasi Digital",
  date: "07 Ogos 2026",
};

test("builds an approved khidmat decision WhatsApp link", () => {
  const url = buildKhidmatDecisionWhatsAppUrl("0123456789", {
    ...details,
    decision: "approved",
  });
  const message = new URL(url).searchParams.get("text");
  assert.ok(message);
  assert.match(message, /Permohonan khidmat bantu anda telah diluluskan\./);
  assert.match(message, /Perkhidmatan: Ceramah/);
  assert.match(message, /Tajuk: Literasi Digital/);
});

test("builds a rejected khidmat decision WhatsApp link", () => {
  const url = buildKhidmatDecisionWhatsAppUrl("0123456789", {
    ...details,
    decision: "rejected",
  });
  const message = new URL(url).searchParams.get("text");
  assert.ok(message);
  assert.match(message, /tidak dapat diluluskan/);
  assert.doesNotMatch(message, /telah diluluskan/);
});

test("returns empty when the applicant phone is invalid", () => {
  assert.equal(
    buildKhidmatDecisionWhatsAppUrl("abc", { ...details, decision: "approved" }),
    "",
  );
});
