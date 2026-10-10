import assert from "node:assert/strict";
import test from "node:test";
import { parseBelumLoginCsv } from "../../lib/analisis/delima-belum-parse";

const csv = [
  "﻿email,name,jpn,ppd,kodsekolah,nama_institusi,login_status",
  "a@moe-dl.edu.my,SITI  AMINAH,PERAK,PPD MANJUNG,aba1007,SK PANCHOR,belum_login",
  "b@moe-dl.edu.my,ALI BIN ABU,PERAK,PPD MANJUNG,ABA1007,SK PANCHOR,belum_login",
  "A@moe-dl.edu.my,SITI AMINAH,PERAK,PPD MANJUNG,ABA1007,SK PANCHOR,belum_login",
  "c@moe-dl.edu.my,LAIN DAERAH,PERAK,PPD KINTA UTARA,ABA2001,SK X,belum_login",
  "d@moe-dl.edu.my,SUDAH LOGIN,PERAK,PPD MANJUNG,ABA1007,SK PANCHOR,sudah_login",
  'e@moe-dl.edu.my,"KOMA, NAMA",PERAK,PPD MANJUNG,ABA1001,SK DENDANG,belum_login',
].join("\n");

test("parseBelumLoginCsv: tapis PPD + status, buang pendua, normal huruf & ruang", () => {
  const r = parseBelumLoginCsv(csv, "manjung");
  assert.deepEqual(r, [
    { kod: "ABA1001", nama: "KOMA, NAMA" },
    { kod: "ABA1007", nama: "ALI BIN ABU" },
    { kod: "ABA1007", nama: "SITI AMINAH" },
  ]);
});

test("parseBelumLoginCsv: format salah dilempar ralat", () => {
  assert.throws(() => parseBelumLoginCsv("a,b,c\n1,2,3", "manjung"), /Format tidak dikenali/);
});
