import assert from "node:assert/strict";
import test from "node:test";
import {
  isSuratUploadMetaReady,
  suratUploadWaitHint,
} from "../../lib/khidmat-bantu/surat-upload-meta";

test("upload meta is ready only with org name and ISO date", () => {
  assert.equal(isSuratUploadMetaReady("", "2026-09-07"), false);
  assert.equal(isSuratUploadMetaReady("SK Manjung", ""), false);
  assert.equal(isSuratUploadMetaReady("SK Manjung", "07/09/2026"), false);
  assert.equal(isSuratUploadMetaReady("SK Manjung", "2026-09-07"), true);
  assert.equal(isSuratUploadMetaReady("  SK Manjung  ", "2026-09-07"), true);
});

test("wait hint names only the missing fields", () => {
  assert.equal(
    suratUploadWaitHint("", ""),
    "Fail dipilih. Isi nama sekolah/unit dan tarikh cadangan untuk memuat naik.",
  );
  assert.equal(
    suratUploadWaitHint("", "2026-09-07"),
    "Fail dipilih. Isi nama sekolah/unit untuk memuat naik.",
  );
  assert.equal(
    suratUploadWaitHint("SK Manjung", ""),
    "Fail dipilih. Isi tarikh cadangan untuk memuat naik.",
  );
  assert.equal(suratUploadWaitHint("SK Manjung", "2026-09-07"), null);
});
