import sharp from "sharp";

/**
 * Mampat gambar sebelum dimuat naik ke Supabase Storage (pelan free tier —
 * kuota egress 5.5 GB/bulan). Gambar asal 2–4 MB dipaparkan pada saiz kecil
 * (logo 40–80px), jadi setiap lawatan memuat turun megabait yang sia-sia.
 *
 * - logo  → muat dalam 320×320, PNG berpalet (kekal lutsinar)
 * - photo → muat dalam 1600×1600, JPEG mozjpeg q80 (latar putih jika lutsinar)
 *
 * Jika sharp gagal (format tidak disokong, cth. SVG/GIF animasi), fail asal
 * dipulangkan tanpa perubahan supaya muat naik tidak terhalang.
 */
export type ImageKind = "logo" | "photo";

export type UploadFile = { name: string; type: string; buffer: Buffer };

const SPEC: Record<ImageKind, { max: number }> = {
  logo: { max: 320 },
  photo: { max: 1600 },
};

function gantiSambungan(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  return `${dot > 0 ? name.slice(0, dot) : name || "gambar"}.${ext}`;
}

export async function compressImage(file: UploadFile, kind: ImageKind): Promise<UploadFile> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  try {
    const { max } = SPEC[kind];
    const pipeline = sharp(file.buffer, { failOn: "none" })
      .rotate() // ikut orientasi EXIF, kemudian metadata dibuang
      .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true });

    const out =
      kind === "logo"
        ? {
            buffer: await pipeline.png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer(),
            type: "image/png",
            ext: "png",
          }
        : {
            buffer: await pipeline
              .flatten({ background: "#ffffff" })
              .jpeg({ quality: 80, mozjpeg: true })
              .toBuffer(),
            type: "image/jpeg",
            ext: "jpg",
          };

    // Jangan ganti jika hasil lebih besar (fail asal sudah kecil/teroptimum).
    if (out.buffer.length >= file.buffer.length) return file;
    return { name: gantiSambungan(file.name, out.ext), type: out.type, buffer: out.buffer };
  } catch (e) {
    console.warn("[compressImage] gagal, guna fail asal:", e instanceof Error ? e.message : e);
    return file;
  }
}
