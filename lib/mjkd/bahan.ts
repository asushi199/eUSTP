/** Bahan MJKD: pengesahan, URL paparan/muat turun dan pengumpulan (tulen — selamat untuk klien). */
import { z } from "zod";
import { huraiPilihanHari, labelHariPendek } from "./hari";

export const JENIS_BAHAN = ["PAUTAN", "PDF"] as const;
export type JenisBahan = (typeof JENIS_BAHAN)[number];

/** Had PDF 3 MB (had permintaan Vercel 4.5 MB). */
export const BAHAN_PDF_MAKS_BYTE = 3 * 1024 * 1024;
export const PAUTAN_BAHAN_MAKS = 1000;

export function isJenisBahan(v: string): v is JenisBahan {
  return (JENIS_BAHAN as readonly string[]).includes(v);
}

export type PautanResult = { ok: true; url: string } | { ok: false; error: string };

/** Pautan bahan: mesti https (mana-mana hos), tanpa kelayakan terbenam. */
export function sahkanPautanBahan(raw: string): PautanResult {
  const teks = raw.trim();
  if (!teks) return { ok: false, error: "Sila isi pautan bahan." };
  if (teks.length > PAUTAN_BAHAN_MAKS) return { ok: false, error: "Pautan terlalu panjang." };
  let u: URL;
  try {
    u = new URL(teks);
  } catch {
    return { ok: false, error: "Pautan tidak sah. Mulakan dengan https://" };
  }
  if (u.protocol !== "https:") {
    return { ok: false, error: "Pautan mesti bermula dengan https://" };
  }
  if (u.username || u.password) return { ok: false, error: "Pautan tidak sah." };
  return { ok: true, url: u.toString() };
}

const ID_GOOGLE = /^[A-Za-z0-9_-]{10,}$/;

/**
 * URL benam (iframe) bagi pautan Google Slides/Docs/Sheets/Drive; null jika tidak boleh dibenam
 * (hos lain, cth. Canva, atau folder Drive) — paparan hendaklah dibuka di tab baharu.
 */
export function terbitkanUrlEmbed(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  const segmen = u.pathname.split("/").filter(Boolean);

  if (host === "docs.google.com") {
    const [jenis, d, ...baki] = segmen;
    if (d !== "d" || !jenis) return null;
    const diterbit = baki[0] === "e";
    const id = diterbit ? baki[1] : baki[0];
    if (!id || !ID_GOOGLE.test(id)) return null;
    const asas = `https://docs.google.com/${jenis}/d/${diterbit ? `e/${id}` : id}`;
    if (jenis === "presentation") return `${asas}/embed?start=false&loop=false`;
    if (jenis === "document") return diterbit ? `${asas}/pub?embedded=true` : `${asas}/preview`;
    if (jenis === "spreadsheets") {
      return diterbit ? `${asas}/pubhtml?widget=true&headers=false` : `${asas}/preview`;
    }
    return null;
  }

  if (host === "drive.google.com") {
    if (segmen[0] === "file" && segmen[1] === "d" && segmen[2] && ID_GOOGLE.test(segmen[2])) {
      return `https://drive.google.com/file/d/${segmen[2]}/preview`;
    }
    if (segmen[0] === "open" || segmen[0] === "uc") {
      const id = u.searchParams.get("id");
      if (id && ID_GOOGLE.test(id)) return `https://drive.google.com/file/d/${id}/preview`;
    }
    return null;
  }
  return null;
}

/** id fail Drive daripada storage_path "drive/{fileId}". */
export function idDriveDariPath(path: string): string | null {
  const m = /^drive\/([A-Za-z0-9_-]+)$/.exec(path.trim());
  return m ? m[1]! : null;
}

export function urlPratontonDrive(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function urlMuatTurunDrive(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/** Pautan muat turun hanya untuk PDF yang disimpan di Drive. */
export function urlMuatTurunBahan(b: { jenis: string; storagePath: string }): string | null {
  if (b.jenis !== "PDF") return null;
  const id = idDriveDariPath(b.storagePath);
  return id ? urlMuatTurunDrive(id) : null;
}

/** URL benam bagi paparan: PDF Drive = pratonton; pautan = terbitan Google atau null. */
export function urlEmbedBahan(b: { jenis: string; url: string }): string | null {
  if (b.jenis === "PDF") return terbitkanUrlEmbed(b.url) ?? b.url;
  return terbitkanUrlEmbed(b.url);
}

const AKRONIM = new Set(["PPD", "JPN", "KPM", "STEM", "ICT", "HEM", "PK", "USTP", "PSS", "DPD", "BPK"]);

/** "PENGURUSAN_SEKOLAH" -> "Pengurusan Sekolah" (akronim kekal huruf besar). */
export function sektorBolehBaca(raw: string): string {
  return raw
    .trim()
    .replace(/[_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const besar = w.toUpperCase();
      if (AKRONIM.has(besar)) return besar;
      return besar.charAt(0) + besar.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Cadangan sektor/unit: unik (tidak peka huruf besar-kecil), diisih. */
export function cadanganSektor(...senarai: readonly (readonly string[])[]): string[] {
  const peta = new Map<string, string>();
  for (const s of senarai) {
    for (const nilai of s) {
      const t = nilai.trim().replace(/\s+/g, " ");
      if (t && !peta.has(t.toLowerCase())) peta.set(t.toLowerCase(), t);
    }
  }
  return [...peta.values()].sort((a, b) => a.localeCompare(b, "ms"));
}

const teks = (maks: number, kosong: string, panjang: string) =>
  z
    .string()
    .transform((v) => v.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(1, kosong).max(maks, panjang));

const bahanAsas = z.object({
  sektorUnit: teks(150, "Sila isi Sektor / Unit.", "Sektor / Unit terlalu panjang."),
  tajuk: teks(300, "Sila isi tajuk bahan.", "Tajuk terlalu panjang."),
  namaPembentang: teks(200, "Sila isi nama pembentang.", "Nama pembentang terlalu panjang."),
});

export type BahanData = {
  sektorUnit: string;
  tajuk: string;
  namaPembentang: string;
  hari: string[];
};

export type SahkanBahanResult = { ok: true; data: BahanData } | { ok: false; error: string };

/**
 * Sahkan medan asas bahan. `hariNilai` ialah nilai radio (tarikh dicantum koma) dan hanya
 * tarikh dalam `hariSah` (hari mesyuarat) diterima.
 */
export function sahkanBahanInput(
  input: { sektorUnit: string; tajuk: string; namaPembentang: string; hariNilai: string },
  hariSah: readonly string[],
): SahkanBahanResult {
  const asas = bahanAsas.safeParse(input);
  if (!asas.success) {
    return { ok: false, error: asas.error.issues[0]?.message ?? "Input tidak sah." };
  }
  const hari = huraiPilihanHari(input.hariNilai, hariSah);
  if (hari.length === 0) return { ok: false, error: "Sila pilih tarikh pembentangan." };
  return { ok: true, data: { ...asas.data, hari } };
}

export type BahanKumpulItem = {
  id: string;
  sektorUnit: string;
  hari: string[];
  createdAt: Date | string;
};

export type KumpulanHari<T extends BahanKumpulItem> = {
  hari: string;
  label: string;
  sektor: { sektorUnit: string; bahan: T[] }[];
};

/**
 * Kumpul bahan mengikut hari kemudian Sektor/Unit. Bahan untuk dua hari muncul di bawah
 * kedua-duanya. Hari diisih menaik; sektor ikut abjad; dalam sektor ikut masa dimuat naik.
 */
export function kumpulBahan<T extends BahanKumpulItem>(bahan: readonly T[]): KumpulanHari<T>[] {
  const hari = [...new Set(bahan.flatMap((b) => b.hari))].sort();
  const masa = (b: T) => new Date(b.createdAt).getTime();
  return hari.map((h) => {
    const sektorMap = new Map<string, { sektorUnit: string; bahan: T[] }>();
    for (const b of bahan.filter((x) => x.hari.includes(h))) {
      const kunci = b.sektorUnit.trim().toLowerCase();
      const kumpulan = sektorMap.get(kunci) ?? { sektorUnit: b.sektorUnit, bahan: [] };
      kumpulan.bahan.push(b);
      sektorMap.set(kunci, kumpulan);
    }
    const sektor = [...sektorMap.values()]
      .sort((a, b) => a.sektorUnit.localeCompare(b.sektorUnit, "ms"))
      .map((k) => ({ ...k, bahan: [...k.bahan].sort((a, b) => masa(a) - masa(b)) }));
    return { hari: h, label: labelHariPendek(h), sektor };
  });
}
