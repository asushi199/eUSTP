import assert from "node:assert/strict";
import test from "node:test";
import { buildEquipmentDecisionWhatsAppUrl } from "../../lib/peralatan/whatsapp";

const details = {
  referenceNo: "PP-2026-2FA66D4E",
  applicantName: "ASLINDA BINTI CHE AHMAD",
  pkgName: "PKG Manjung",
  borrowDate: "2026-08-07",
  expectedReturnDate: "2026-09-11",
  items: ["Komputer riba (20)"],
  decisionNote: "Sila bawa surat pengesahan.",
};

test("uses the approval wording when equipment has been handed over", () => {
  const url = buildEquipmentDecisionWhatsAppUrl("0123456789", {
    ...details,
    decision: "handed_over",
  });

  const message = new URL(url).searchParams.get("text");
  assert.ok(message);
  assert.match(message, /Permohonan pinjaman peralatan anda telah diluluskan\./);
  assert.doesNotMatch(message, /telah diserahkan/);
});

test("includes the administrator note when equipment has been handed over", () => {
  const url = buildEquipmentDecisionWhatsAppUrl("0123456789", {
    ...details,
    decision: "handed_over",
  });

  const message = new URL(url).searchParams.get("text");
  assert.ok(message);
  assert.match(message, /Catatan: Sila bawa surat pengesahan\./);
  assert.match(message, /Sila simpan makluman ini untuk rekod anda\./);
});

test("uses the same note footer when equipment is approved", () => {
  const url = buildEquipmentDecisionWhatsAppUrl("0123456789", {
    ...details,
    decision: "approved",
  });

  const message = new URL(url).searchParams.get("text");
  assert.ok(message);
  assert.match(message, /Catatan: Sila bawa surat pengesahan\./);
  assert.match(message, /Sila simpan makluman ini untuk rekod anda\./);
  assert.doesNotMatch(message, /untuk urusan pengambilan peralatan/);
});
