import assert from "node:assert/strict";
import test from "node:test";
import {
  extractGooglePhotosUrl,
  isGooglePhotosUrl,
} from "../../lib/media/google-photos";

test("accepts shared Google Photos album hosts", () => {
  assert.equal(isGooglePhotosUrl("https://photos.app.goo.gl/AbCdEf123"), true);
  assert.equal(isGooglePhotosUrl("photos.app.goo.gl/AbCdEf123"), true);
  assert.equal(
    isGooglePhotosUrl("https://photos.google.com/share/AF1QipExample?key=abc"),
    true,
  );
  assert.equal(
    isGooglePhotosUrl("https://www.photos.google.com/album/AF1QipExample"),
    true,
  );
  assert.equal(isGooglePhotosUrl("https://drive.google.com/file/d/abc/view"), false);
  assert.equal(isGooglePhotosUrl("https://lh3.googleusercontent.com/d/abc"), false);
});

test("extracts a Google Photos URL from mixed Telegram text", () => {
  assert.equal(
    extractGooglePhotosUrl("https://photos.app.goo.gl/AbCdEf123."),
    "https://photos.app.goo.gl/AbCdEf123",
  );
  assert.equal(
    extractGooglePhotosUrl("/foto https://photos.app.goo.gl/AbCdEf123"),
    "https://photos.app.goo.gl/AbCdEf123",
  );
  assert.equal(
    extractGooglePhotosUrl("Album program: https://photos.google.com/share/AF1QipX sila semak"),
    "https://photos.google.com/share/AF1QipX",
  );
  assert.equal(extractGooglePhotosUrl("tiada pautan album"), null);
});
