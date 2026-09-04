import assert from "node:assert/strict";
import test from "node:test";
import { isMoeDlEmail, safeDirektoriCallbackUrl } from "../../lib/moe-dl";

test("accepts only @moe-dl.edu.my", () => {
  assert.equal(isMoeDlEmail("guru@moe-dl.edu.my"), true);
  assert.equal(isMoeDlEmail("  Guru.Nama@MOE-DL.EDU.MY  "), true);
  assert.equal(isMoeDlEmail("guru@gmail.com"), false);
  assert.equal(isMoeDlEmail("guru@school.moe-dl.edu.my"), false);
  assert.equal(isMoeDlEmail("guru@moe-dl.edu.my.evil.com"), false);
  assert.equal(isMoeDlEmail("@moe-dl.edu.my"), false);
  assert.equal(isMoeDlEmail(""), false);
});

test("blocks open redirects on directory callback", () => {
  assert.equal(safeDirektoriCallbackUrl("/direktori/gpict"), "/direktori/gpict");
  assert.equal(safeDirektoriCallbackUrl("/admin"), "/direktori");
  assert.equal(safeDirektoriCallbackUrl("https://evil.example"), "/direktori");
  assert.equal(safeDirektoriCallbackUrl("//evil.example"), "/direktori");
});
