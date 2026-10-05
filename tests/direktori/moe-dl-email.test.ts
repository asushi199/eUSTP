import assert from "node:assert/strict";
import test from "node:test";
import {
  direktoriLoginHref,
  isMoeDlEmail,
  isTebusBukuCallback,
  safeDirektoriCallbackUrl,
} from "../../lib/moe-dl";

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
  assert.equal(safeDirektoriCallbackUrl("/direktori/ustp"), "/direktori/ustp");
  assert.equal(safeDirektoriCallbackUrl("/admin"), "/direktori");
  assert.equal(safeDirektoriCallbackUrl("https://evil.example"), "/direktori");
  assert.equal(safeDirektoriCallbackUrl("//evil.example"), "/direktori");
});

test("allows returning to Semak Tebus Buku after MOE-DL login", () => {
  assert.equal(
    safeDirektoriCallbackUrl("/laporan/tebus-buku/ABA1031"),
    "/laporan/tebus-buku/ABA1031",
  );
  assert.equal(isTebusBukuCallback("/laporan/tebus-buku/ABA1031"), true);
  assert.equal(isTebusBukuCallback("/direktori/ustp"), false);
  assert.equal(
    direktoriLoginHref("/laporan/tebus-buku/ABA1031"),
    "/direktori/log-masuk?from=%2Flaporan%2Ftebus-buku%2FABA1031",
  );
  // Laluan lain di bawah /laporan tetap ditolak.
  assert.equal(safeDirektoriCallbackUrl("/laporan/akhbar"), "/direktori");
  assert.equal(safeDirektoriCallbackUrl("https://evil.example/laporan/tebus-buku"), "/direktori");
});
