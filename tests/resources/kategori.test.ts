import assert from "node:assert/strict";
import test from "node:test";
import {
  inferResourceCardType,
  toResourcesSectionGroups,
} from "../../lib/resources/card-display";
import {
  RESOURCES_KATEGORI,
  resourcesHref,
  resourcesKategoriBySlug,
} from "../../lib/resources/kategori";

test("keeps pekeliling as a CoE Resources category without OSC source", () => {
  const pekeliling = resourcesKategoriBySlug("pekeliling");
  assert.ok(pekeliling);
  assert.equal(pekeliling?.title, "Pekeliling / Siaran STP");
  assert.equal(resourcesHref("pekeliling"), "/resources/pekeliling");
  assert.equal(RESOURCES_KATEGORI.some((k) => k.slug === "pekeliling"), true);
  assert.equal(RESOURCES_KATEGORI.some((k) => k.slug === "sijil"), false);
  assert.equal(resourcesKategoriBySlug("sijil"), undefined);
});

test("maps kategori groups into section view for nested cards", () => {
  const groups = toResourcesSectionGroups([
    {
      slug: "pekeliling",
      title: "Pekeliling / Siaran STP",
      blurb: "Surat pekeliling",
      cards: [
        {
          id: 1,
          title: "SPI 1",
          url: "https://drive.google.com/file/d/abc/view",
          aktif: true,
        },
      ],
    },
  ]);
  assert.equal(groups[0]?.cards[0]?.typeLabel, "PDF");
  assert.equal(groups[0]?.slug, "pekeliling");
});

test("infers Drive PDF and Canva URLs for preview", () => {
  assert.equal(
    inferResourceCardType("https://drive.google.com/file/d/abc/view"),
    "pdf",
  );
  assert.equal(
    inferResourceCardType("https://www.canva.com/design/xyz/view"),
    "canva",
  );
  assert.equal(inferResourceCardType("https://example.com/nota"), "link");
});
