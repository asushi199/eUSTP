import assert from "node:assert/strict";
import test from "node:test";
import {
  cardMatchesResourceQuery,
  cardMonthKeys,
  filenameFromUrl,
  filterResourceCards,
  formatResourceMonthLabel,
  latestResourceMonth,
  listLetterMonthChoices,
  listLetterMonthWindow,
  listResourceMonthOptions,
  normalizeResourceQuery,
  resourceMonthKey,
  shiftLetterMonth,
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
    letterMonth: null,
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

test("uses the chosen letter month instead of the upload month", () => {
  const late = card({
    title: "Jemputan Program DELIMa",
    createdAt: "2026-09-04T04:00:00.000Z",
    letterMonth: "2026-07",
  });
  assert.equal(cardMonthKeys(late).includes("2026-07"), true);
  assert.equal(cardMonthKeys(late).includes("2026-09"), false);
  assert.equal(filterResourceCards([late], { month: "2026-07" }).length, 1);
  assert.equal(filterResourceCards([late], { month: "2026-09" }).length, 0);
});

test("lists letter-month choices around the current Malaysia month", () => {
  const choices = listLetterMonthChoices(new Date("2026-09-04T12:00:00+08:00"));
  assert.equal(choices[0]?.value, "2026-11");
  assert.equal(choices.some((c) => c.value === "2026-09" && c.label === "September 2026"), true);
  assert.equal(choices.at(-1)?.value, "2025-09");
  assert.equal(choices.length, 15);
});

test("windows NexaBot months seven before and after the centered month", () => {
  const window = listLetterMonthWindow("2026-09");
  assert.equal(window.length, 15);
  assert.equal(window[0]?.value, "2026-02");
  assert.equal(window[7]?.value, "2026-09");
  assert.equal(window[14]?.value, "2027-04");
  assert.equal(shiftLetterMonth("2026-09", -12), "2025-09");
  assert.equal(shiftLetterMonth("2026-01", -1), "2025-12");
});

test("picks the latest month that actually has letters", () => {
  const cards = [
    card({
      id: 1,
      title: "Surat Julai",
      createdAt: "2026-07-02T04:00:00.000Z",
      letterMonth: "2026-07",
    }),
    card({
      id: 2,
      title: "Surat Ogos",
      createdAt: "2026-09-01T04:00:00.000Z",
      letterMonth: "2026-08",
    }),
  ];
  const months = listResourceMonthOptions(cards);
  assert.equal(months[0]?.value, "2026-08");
  assert.equal(latestResourceMonth(cards), "2026-08");
  assert.equal(latestResourceMonth([]), "");
});
