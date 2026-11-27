import type { KodMaklumat, KodSebab } from "./jenis";
import type { Standard } from "./standard";

export const LABEL_SEBAB: Record<KodSebab, string> = {
  "ruangan-kosong": "Rumusan/Pengajaran tidak lengkap",
  "terlalu-pendek": "Terlalu pendek",
  templat: "Templat (rumusan sama untuk ≥ 3 buku)",
  "rumusan-sama-pengajaran": "Rumusan sama dengan Pengajaran",
  "hantar-semula-sama": "Dihantar semula tanpa pindaan",
  "teks-rawak": "Teks rawak / berulang",
  "bahasa-tak-sepadan": "Bahasa tidak sepadan dengan buku",
  "bahasa-bercampur": "Bahasa Rumusan dan Pengajaran berbeza",
  "agak-pendek": "Agak pendek",
  "rumusan-sama-2-buku": "Rumusan sama untuk 2 buku",
  "sama-murid-lain": "Sama dengan murid lain",
  "buku-sama-berulang": "Buku sama direkod semula",
  "simbol-pengisi": "Simbol/tanda baca pengisi",
  "tiada-unsur-pengajaran": "Pengajaran tiada unsur pengajaran",
};

export const LABEL_MAKLUMAT: Record<KodMaklumat, string> = {
  "murid-luar-biasa": "Murid dengan rekod luar biasa banyak",
  "frasa-ai": "Frasa lazim AI/terjemahan",
};

export const KOMEN_LALAI: Record<KodSebab, string> = {
  "ruangan-kosong": "Rumusan/Pengajaran tidak lengkap. Sila tulis semula dengan lengkap.",
  "terlalu-pendek": "Rumusan dan pengajaran terlalu pendek. Sila huraikan isi buku dengan ayat sendiri.",
  templat: "Rumusan ini sama dengan rekod buku lain. Sila tulis rumusan khusus untuk buku ini.",
  "rumusan-sama-pengajaran": "Rumusan dan pengajaran tidak boleh sama.",
  "hantar-semula-sama": "Rekod ini telah dihantar sebelum ini.",
  "teks-rawak": "Teks tidak dapat difahami. Sila tulis semula rumusan dan pengajaran.",
  "bahasa-tak-sepadan": "Rumusan hendaklah dalam bahasa buku yang dibaca.",
  "bahasa-bercampur": "Rumusan dan pengajaran hendaklah ditulis dalam bahasa yang sama.",
  "agak-pendek": "Rumusan dan pengajaran agak pendek. Sila huraikan dengan lebih lengkap.",
  "rumusan-sama-2-buku": "Rumusan ini sama dengan rekod buku lain. Sila tulis rumusan khusus untuk buku ini.",
  "sama-murid-lain": "Rumusan ini sama dengan murid lain. Sila tulis dengan ayat sendiri.",
  "buku-sama-berulang": "Buku ini telah direkodkan sebelum ini.",
  "simbol-pengisi": "Jangan gunakan tanda baca berulang untuk memanjangkan teks.",
  "tiada-unsur-pengajaran": "Pengajaran hendaklah menyatakan nilai atau pengajaran daripada buku.",
};

/** Komen lalai apabila GPM menolak rekod yang tiada sebab automatik (cth. rekod "Cadang lulus"). */
export const KOMEN_TANPA_SEBAB = "Rekod ini belum memenuhi kehendak. Sila semak semula rumusan dan pengajaran, kemudian hantar semula.";

/**
 * Komen penolakan satu rekod: gabungan komen unik bagi sebab merah (atau kuning
 * jika tiada merah). Keutamaan teks: `ganti` (suntingan dialog) → tetapan GPM → lalai.
 */
export function janaKomen(
  merah: KodSebab[],
  kuning: KodSebab[],
  standard: Standard,
  ganti: Partial<Record<KodSebab, string>> = {},
): string {
  const sebab = merah.length ? merah : kuning;
  const teks = sebab.map((k) => (ganti[k] ?? standard.komen[k] ?? KOMEN_LALAI[k]).trim()).filter(Boolean);
  return [...new Set(teks)].join(" ").slice(0, 500);
}
