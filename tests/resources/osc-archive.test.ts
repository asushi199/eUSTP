import assert from "node:assert/strict";
import test from "node:test";
import { classifyOscCard } from "../../scripts/osc-archive";

test("keeps kertas kerja, OPR and ePelaporan in the year archive", () => {
  assert.deepEqual(
    classifyOscCard({
      subtopikKey: "slot-kertas-kerja",
      title: "Kertas Kerja Program",
      url: "https://drive.google.com/file/d/abc/view",
      type: "pdf",
    }),
    {
      dest: "arkib",
      title: "Kertas kerja · Kertas Kerja Program",
      url: "https://drive.google.com/file/d/abc/view",
      letterMonth: "2025-01",
    },
  );
  assert.equal(
    classifyOscCard({
      subtopikKey: "slot-opr",
      title: "PROGRAM PERAK R.E.A.D 2025",
      url: "https://drive.google.com/file/d/opr/view",
      type: "pdf",
    }).title,
    "OPR · PROGRAM PERAK R.E.A.D 2025",
  );
  assert.deepEqual(
    classifyOscCard({
      subtopikKey: "slot-pelaporan",
      title: "Epelaporan 2023",
      url: "https://www.canva.com/design/abc/view",
      type: "canva",
    }),
    {
      dest: "arkib",
      title: "ePelaporan · 2023",
      url: "https://www.canva.com/design/abc/view",
      letterMonth: "2023-01",
    },
  );
});

test("moves hebahan and pencapaian visuals to media, books to nota", () => {
  assert.equal(
    classifyOscCard({
      subtopikKey: "slot-hari-terbuka",
      title: "Hari Terbuka PPD Manjung",
      url: "https://example.com/hebahan.png",
      type: "image",
    }).dest,
    "media",
  );
  assert.equal(
    classifyOscCard({
      subtopikKey: "slot-buku",
      title: "Buku Pengurusan USTP 2026",
      url: "https://www.canva.com/design/buku/view",
      type: "canva",
    }).dest,
    "nota",
  );
});

test("drops Looker, classroom, contoh DELIMa and site embeds", () => {
  for (const input of [
    {
      subtopikKey: "slot-pelaporan",
      title: "Pelaporan DPD",
      url: "https://lookerstudio.google.com/embed/reporting/abc",
      type: "embed",
    },
    {
      subtopikKey: "slot-classroom",
      title: "Google Classroom USTP Manjung",
      url: "https://classroom.google.com/",
      type: "image",
    },
    {
      subtopikKey: "slot-bahan-delima",
      title: "Contoh GC SMK RAJA SHAHRIMAN",
      url: "https://drive.google.com/file/d/delima/view",
      type: "pdf",
    },
    {
      subtopikKey: "slot-jnj",
      title: "PSS Maya SESDA",
      url: "https://sesdamaya.rakmaya.com/",
      type: "embed",
    },
  ]) {
    assert.equal(classifyOscCard(input).dest, "drop", input.title);
  }
});
