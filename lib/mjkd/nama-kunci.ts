/** Normalkan nama untuk elak rekod berganda: HURUF BESAR, trim, ruang berganda dibuang. */
export function namaKunci(nama: string): string {
  return nama.normalize("NFC").trim().replace(/\s+/g, " ").toUpperCase();
}
