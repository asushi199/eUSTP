import assert from "node:assert/strict";
import test from "node:test";
import { betulkanNamaDcs, type DcsSnapshot } from "../../lib/analisis/dcs-types";

const sekolah = (kod: string, nama: string) => ({
  kod,
  nama,
  pkg: "Sitiawan",
  kelasSiap: 0,
  kelasJumlah: 1,
  muridSiap: 19,
  muridJumlah: 20,
  skorT6: 3.57,
  skorT3: null,
  skorT5: null,
});

test("betulkanNamaDcs: nama lama DCS diganti ikut kod, sekolah lain tidak berubah", () => {
  const s: DcsSnapshot = {
    tahun: 2026,
    capturedOn: "2026-11-17",
    sumber: "http://dcs.moe.edu.my/",
    jumlahPkgPerak: 0,
    pkg: [],
    sekolah: [sekolah("ABB1043", "SK SIMPANG EMPAT"), sekolah("ABA1015", "SK SERI SELAMAT")],
  };
  const b = betulkanNamaDcs(s);
  assert.equal(b.sekolah[0]!.nama, "SK SERI SERDANG");
  assert.equal(b.sekolah[0]!.muridSiap, 19);
  assert.equal(b.sekolah[1]!.nama, "SK SERI SELAMAT");
  // Input asal tidak diubah.
  assert.equal(s.sekolah[0]!.nama, "SK SIMPANG EMPAT");
});
