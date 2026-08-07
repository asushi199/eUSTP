import assert from "node:assert/strict";
import test from "node:test";
import { buildEquipmentLookupWhatsAppUrl } from "../../lib/peralatan/lookup-whatsapp";

const request = {
  id: "e27d8c6c-6bd7-4d70-9d27-65e9d0f9b4dc",
  pkgId: "pkg-manjung",
  managerPhone: "0123456789",
  referenceNo: "PP-2026-2FA66D4E",
  applicantName: "ASLINDA BINTI CHE AHMAD",
  orgName: "SK PANGKALAN TLDM II",
  borrowDate: "2026-08-07",
  expectedReturnDate: "2026-08-09",
  status: "pending" as const,
};

test("builds an admin WhatsApp resend link for a pending equipment application", () => {
  const url = buildEquipmentLookupWhatsAppUrl(request, "https://eustp.example");

  assert.ok(url);
  assert.match(url, /^https:\/\/wa\.me\/60123456789\?text=/);
  const message = new URL(url).searchParams.get("text");
  assert.match(message ?? "", /Rujukan: PP-2026-2FA66D4E/);
  assert.match(
    message ?? "",
    /https:\/\/eustp\.example\/admin\/peralatan\/pkg-manjung\/permohonan\/e27d8c6c-6bd7-4d70-9d27-65e9d0f9b4dc/,
  );
});

test("does not offer WhatsApp resend after an equipment application is processed", () => {
  const url = buildEquipmentLookupWhatsAppUrl(
    { ...request, status: "approved" },
    "https://eustp.example",
  );

  assert.equal(url, undefined);
});
