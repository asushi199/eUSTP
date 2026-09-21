import assert from "node:assert/strict";
import test from "node:test";
import {
  canDeleteKhidmatFromAdmin,
  canEditKhidmatFromAdmin,
  rebuildKhidmatDetails,
} from "../../lib/khidmat-bantu/admin";
import type { KhidmatMcpDetails, KhidmatProgramDetails } from "../../lib/schema";

const surat = {
  storagePath: "drive/abc",
  fileName: "surat.pdf",
  originalName: "surat-asal.pdf",
};

const program: KhidmatProgramDetails = {
  tarikhCadangan: "2026-08-07",
  masaCadangan: "9:00 pagi",
  lokasi: "Dewan SK Contoh",
  suratPermohonan: surat,
  tajuk: "Literasi Digital",
};

const mcp: KhidmatMcpDetails = {
  tarikh: "2026-08-08",
  masa: "10:00 pagi",
  lokasi: "Studio MCP",
  suratPermohonan: surat,
  tajukProgram: "Siaran STEM",
};

test("admin can edit pending or approved khidmat requests", () => {
  assert.equal(canEditKhidmatFromAdmin("pending"), true);
  assert.equal(canEditKhidmatFromAdmin("approved"), true);
  assert.equal(canEditKhidmatFromAdmin("rejected"), false);
  assert.equal(canEditKhidmatFromAdmin("cancelled"), false);
});

test("admin can delete any khidmat status", () => {
  assert.equal(canDeleteKhidmatFromAdmin("pending"), true);
  assert.equal(canDeleteKhidmatFromAdmin("approved"), true);
  assert.equal(canDeleteKhidmatFromAdmin("rejected"), true);
  assert.equal(canDeleteKhidmatFromAdmin("cancelled"), true);
});

test("rebuilds program details and keeps the surat", () => {
  const next = rebuildKhidmatDetails("ceramah", program, {
    tajuk: "Bengkel AI",
    tarikh: "2026-09-21",
    masa: "2:00 petang",
    lokasi: "Bilik ICT",
  }) as KhidmatProgramDetails;

  assert.equal(next.tajuk, "Bengkel AI");
  assert.equal(next.tarikhCadangan, "2026-09-21");
  assert.equal(next.masaCadangan, "2:00 petang");
  assert.equal(next.lokasi, "Bilik ICT");
  assert.deepEqual(next.suratPermohonan, surat);
});

test("keeps extra program fields when only the schedule changes", () => {
  const withNotes: KhidmatProgramDetails = {
    ...program,
    bilPeserta: "40",
    catatan: "Perlu LCD",
  };
  const next = rebuildKhidmatDetails("ceramah", withNotes, {
    tajuk: "Literasi Digital",
    tarikh: "2026-09-22",
    masa: "9:00 pagi",
    lokasi: "Dewan SK Contoh",
  }) as KhidmatProgramDetails;

  assert.equal(next.bilPeserta, "40");
  assert.equal(next.catatan, "Perlu LCD");
});

test("rebuilds mcp details when the service type stays mcp", () => {
  const next = rebuildKhidmatDetails("mcp_siaran", mcp, {
    tajuk: "Rakaman baharu",
    tarikh: "2026-10-01",
    masa: "8:00 pagi",
    lokasi: "Studio 2",
  }) as KhidmatMcpDetails;

  assert.equal(next.tajukProgram, "Rakaman baharu");
  assert.equal(next.tarikh, "2026-10-01");
  assert.equal(next.masa, "8:00 pagi");
  assert.equal(next.lokasi, "Studio 2");
  assert.deepEqual(next.suratPermohonan, surat);
});

test("switches program details to mcp shape when the service type changes", () => {
  const next = rebuildKhidmatDetails("mcp_rakaman", program, {
    tajuk: "Rakaman ceramah",
    tarikh: "2026-11-02",
    masa: "11:00 pagi",
    lokasi: "Studio MCP",
  }) as KhidmatMcpDetails;

  assert.equal(next.tajukProgram, "Rakaman ceramah");
  assert.equal(next.tarikh, "2026-11-02");
  assert.equal("tarikhCadangan" in next, false);
  assert.deepEqual(next.suratPermohonan, surat);
});
