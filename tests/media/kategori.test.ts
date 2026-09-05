import assert from "node:assert/strict";
import test from "node:test";
import {
  MEDIA_KATEGORI,
  MEDIA_PLANNED_ITEMS,
  MEDIA_SOCIAL_LINKS,
  mediaHref,
  mediaKategoriBySlug,
} from "../../lib/media/kategori";
import { MEDIA_CARD_ITEMS } from "../../lib/home-modules";

test("keeps a single month-classified collection for CoE Media", () => {
  const koleksi = mediaKategoriBySlug("koleksi");
  assert.ok(koleksi);
  assert.equal(koleksi?.title, "Koleksi Video / Gambar Program");
  assert.equal(mediaHref("koleksi"), "/media/koleksi");
  assert.equal(MEDIA_KATEGORI.length, 1);
});

test("links official USTP social channels and drops Telegram", () => {
  assert.deepEqual(
    MEDIA_SOCIAL_LINKS.map((item) => item.label),
    ["TikTok USTP", "Facebook USTP", "YouTube USTP"],
  );
  assert.equal(MEDIA_SOCIAL_LINKS[0]?.href, "https://www.tiktok.com/@ustpmanjung");
  assert.equal(
    MEDIA_SOCIAL_LINKS[1]?.href,
    "https://www.facebook.com/p/Ustp-Ppd-Manjung-61557576780622/",
  );
  assert.equal(
    MEDIA_PLANNED_ITEMS.some((item) => item.toLowerCase().includes("telegram")),
    false,
  );
  assert.equal(
    MEDIA_CARD_ITEMS.some((item) => item.label.toLowerCase().includes("telegram")),
    false,
  );
});
