import { test } from "node:test";
import assert from "node:assert/strict";
import { janaCsv } from "./csv";
import type { Keputusan, RekodAins } from "./jenis";

const keputusan: Keputusan = {
  id: "abc",
  warna: "merah",
  merah: ["terlalu-pendek"],
  kuning: [],
  maklumat: [],
  bahasa: "bm",
  jalur: "D5-6",
  kodTahap: "D5",
  panjang: 3,
};

test("janaCsv: BOM, kepala, petikan sel", () => {
  const rekod: RekodAins = { id: "abc", tajuk: 'Buku "Hebat", Jilid 1', meta: "", rumusan: "", pengajaran: "", murid: "ALI", kelas: "TAHUN 5 5A" };
  const csv = janaCsv([{ rekod, keputusan, tindakan: "tolak", hasil: "berjaya", masa: "2026-11-25T10:00:00Z" }], "1.0.0");
  assert.ok(csv.startsWith("\uFEFFid,murid,kelas,tajuk,warna,sebab,tindakan,hasil,masa,versi_standard\r\n"));
  assert.ok(csv.includes('"Buku ""Hebat"", Jilid 1"'));
  assert.ok(csv.includes("Terlalu pendek"));
});

test("janaCsv: halang suntikan formula", () => {
  const rekod: RekodAins = { id: "x", tajuk: "=HYPERLINK(1)", meta: "", rumusan: "", pengajaran: "", murid: "+ALI", kelas: "T" };
  const csv = janaCsv([{ rekod, keputusan: { ...keputusan, id: "x" }, tindakan: "", hasil: "", masa: "" }], "1.0.0");
  assert.ok(csv.includes("'=HYPERLINK(1)"));
  assert.ok(csv.includes("'+ALI"));
  const csv2 = janaCsv([{ rekod: { ...rekod, murid: "@ALI" }, keputusan: { ...keputusan, id: "x" }, tindakan: "", hasil: "", masa: "" }], "1.0.0");
  assert.ok(csv2.includes("'@ALI"));
});
