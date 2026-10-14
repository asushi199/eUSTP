import { peringkat, type JenisSekolah } from "./jenis-sekolah";

/**
 * Jawatan PGB mengikut jenis sekolah: rendah = Guru Besar, menengah = Pengetua.
 * Kolej Vokasional (dikelaskan SM) diketuai "Pengarah" — dikesan daripada nama sekolah.
 */
export function jawatanPgb(jenis: JenisSekolah | null, namaSekolah?: string): string {
  if (namaSekolah && /^KOLEJ VOKASIONAL(?![A-Z0-9])/.test(namaSekolah.normalize("NFC").trim().replace(/\s+/g, " ").toUpperCase())) {
    return "Pengarah";
  }
  if (!jenis) return "Pengetua / Guru Besar";
  return peringkat(jenis) === "SM" ? "Pengetua" : "Guru Besar";
}
