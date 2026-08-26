import assert from "node:assert/strict";
import test from "node:test";
import { getNotifyPemohonCopy } from "../../lib/admin/notify-pemohon";

test("asks the admin to notify after approving from the backend", () => {
  const copy = getNotifyPemohonCopy("approved");
  assert.equal(copy.title, "Maklumkan pemohon?");
  assert.match(copy.body, /telah diluluskan/);
  assert.match(copy.body, /tutup dan hantar kemudian dari permohonan ini/);
  assert.equal(copy.confirmLabel, "WhatsApp pemohon");
  assert.equal(copy.dismissLabel, "Tutup");
});

test("asks the admin to notify after rejecting from the backend", () => {
  const copy = getNotifyPemohonCopy("rejected");
  assert.match(copy.body, /telah ditolak/);
  assert.match(copy.body, /tutup dan hantar kemudian dari permohonan ini/);
});

test("explains when the applicant phone cannot open WhatsApp", () => {
  const copy = getNotifyPemohonCopy("approved");
  assert.match(copy.missingPhone, /Nombor WhatsApp pemohon tidak sah/);
  assert.match(copy.missingPhone, /semak nombor pada permohonan ini/);
});
