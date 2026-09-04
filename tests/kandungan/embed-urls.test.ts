import assert from "node:assert/strict";
import test from "node:test";
import {
  driveFileDownloadUrl,
  driveFileId,
  driveFilePreviewUrl,
  driveHiResImageUrl,
  driveImageUrl,
} from "../../lib/kandungan/embed-urls";

test("extracts Drive file ids from view, open, and lh3 URLs", () => {
  assert.equal(
    driveFileId("https://drive.google.com/file/d/abc123/view"),
    "abc123",
  );
  assert.equal(
    driveFileId("https://drive.google.com/open?id=xyz789"),
    "xyz789",
  );
  assert.equal(
    driveFileId("https://lh3.googleusercontent.com/d/abc123=w1600"),
    "abc123",
  );
  assert.equal(driveFileId("https://www.canva.com/design/xyz/view"), null);
});

test("builds iframe preview and Drive image URLs", () => {
  const view = "https://drive.google.com/file/d/abc123/view?usp=sharing";
  assert.equal(
    driveFilePreviewUrl(view),
    "https://drive.google.com/file/d/abc123/preview",
  );
  assert.equal(
    driveHiResImageUrl(view),
    "https://lh3.googleusercontent.com/d/abc123=w2048",
  );
  assert.equal(driveImageUrl(view), "https://lh3.googleusercontent.com/d/abc123");
  assert.equal(
    driveFileDownloadUrl(view),
    "https://drive.google.com/uc?export=download&id=abc123",
  );
  assert.equal(driveHiResImageUrl("https://www.canva.com/design/xyz/view"), null);
});
