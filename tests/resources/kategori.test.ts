import assert from "node:assert/strict";
import test from "node:test";
import {
  inferResourceCardType,
  toResourcesSectionGroups,
} from "../../lib/resources/card-display";
import {
  isResourcesBotKategori,
  isResourcesYearKategori,
  RESOURCES_BOT_KATEGORI_SLUGS,
  RESOURCES_DRIVE_FOLDER,
  RESOURCES_KATEGORI,
  resourcesAdminHref,
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
          letterMonth: "2026-09",
          createdAt: "2026-09-01T00:00:00.000Z",
        },
      ],
    },
  ]);
  assert.equal(groups[0]?.cards[0]?.typeLabel, "PDF");
  assert.equal(groups[0]?.slug, "pekeliling");
  assert.equal(groups[0]?.cards[0]?.letterMonth, "2026-09");
  assert.equal(resourcesAdminHref("pekeliling"), "/admin/resources?kategori=pekeliling");
  assert.equal(resourcesAdminHref(), "/admin/resources");
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

test("allows NexaBot uploads to all four CoE Resources groups", () => {
  assert.deepEqual([...RESOURCES_BOT_KATEGORI_SLUGS], [
    "surat-ustp",
    "surat-sekolah",
    "pekeliling",
    "nota",
  ]);
  assert.equal(isResourcesBotKategori("surat-ustp"), true);
  assert.equal(isResourcesBotKategori("pekeliling"), true);
  assert.equal(isResourcesBotKategori("nota"), true);
  assert.equal(RESOURCES_DRIVE_FOLDER["surat-sekolah"], "Surat-Sekolah");
  assert.equal(RESOURCES_DRIVE_FOLDER.pekeliling, "Pekeliling");
  assert.equal(RESOURCES_DRIVE_FOLDER.nota, "Nota");
  assert.equal(RESOURCES_DRIVE_FOLDER.arkib, "Arkib");
  assert.equal(isResourcesBotKategori("arkib"), false);
  assert.equal(isResourcesYearKategori("arkib"), true);
  assert.equal(isResourcesYearKategori("pekeliling"), false);
  assert.equal(RESOURCES_KATEGORI.some((k) => k.slug === "arkib"), true);
});
