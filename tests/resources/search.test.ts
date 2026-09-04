import assert from "node:assert/strict";
import test from "node:test";
import {
  cardMatchesResourceQuery,
  cardMonthKeys,
  filenameFromUrl,
  filterResourceCards,
  formatResourceMonthLabel,
  normalizeResourceQuery,
  resourceMonthKey,
} from "../../lib/resources/search";
import type { ResourcesExplorerCard } from "../../lib/resources/search";

function card(
  partial: Partial<ResourcesExplorerCard> & Pick<ResourcesExplorerCard, "title">,
): ResourcesExplorerCard {
  return {
    id: 1,
    url: "https://drive.google.com/file/d/abc/view",
    kategoriSlug: "pekeliling",
    kategoriTitle: "Pekeliling / Siaran STP",
    createdAt: "2026-08-26T04:00:00.000Z",
    typeLabel: "PDF",
    embed: { mode: "none" },
    ...partial,
  };
}

test("normalizes dashes and underscores in queries", () => {
  assert.equal(normalizeResourceQuery("SPI_KPM  BIL-2"), "spi kpm bil 2");
});

test("reads a filename from a direct PDF URL", () => {
  assert.equal(
    filenameFromUrl("https://example.com/files/SPI_KPM_BIL_2_TAHUN_2026.pdf"),
    "SPI_KPM_BIL_2_TAHUN_2026",
  );
});

test("matches fuzzy title tokens across kategori and year", () => {
  const spi = card({
    title: "SPI KPM BIL 2 TAHUN 2026_PANDUAN LITERASI AI",
  });
  assert.equal(cardMatchesResourceQuery(spi, "spi literasi"), true);
  assert.equal(cardMatchesResourceQuery(spi, "pekeliling 2026"), true);
  assert.equal(cardMatchesResourceQuery(spi, "minecraft"), false);
});

test("matches Malay month from upload date in Malaysia time", () => {
  assert.equal(resourceMonthKey("2026-08-26T04:00:00.000Z"), "2026-08");
  assert.equal(formatResourceMonthLabel("2026-08"), "Ogos 2026");
  const uploaded = card({ title: "Pengupayaan Google Classroom" });
  assert.equal(cardMatchesResourceQuery(uploaded, "ogos"), true);
  assert.deepEqual(cardMonthKeys(uploaded), ["2026-08"]);
});

test("picks an explicit month written in the title", () => {
  const titled = card({
    title: "Surat Pekeliling 12 Ogos 2025",
    createdAt: "2026-01-10T04:00:00.000Z",
  });
  assert.equal(cardMonthKeys(titled).includes("2025-08"), true);
  assert.equal(cardMonthKeys(titled).includes("2026-01"), true);
});

test("filters by month and query together", () => {
  const cards = [
    card({
      id: 1,
      title: "Surat Pemerkasaan DELIMa 2025–2026",
      createdAt: "2026-08-26T04:00:00.000Z",
    }),
    card({
      id: 2,
      title: "Arahan Tugas USTP 2026",
      createdAt: "2026-07-02T04:00:00.000Z",
    }),
  ];
  const ogos = filterResourceCards(cards, { month: "2026-08" });
  assert.equal(ogos.length, 1);
  assert.equal(ogos[0]?.title.includes("DELIMa"), true);

  const tugas = filterResourceCards(cards, { query: "tugas", month: "2026-07" });
  assert.equal(tugas.length, 1);
  assert.equal(filterResourceCards(cards, { query: "tugas", month: "2026-08" }).length, 0);
});
