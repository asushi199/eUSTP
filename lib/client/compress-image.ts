import {
  LAPORAN_IMAGE_JPEG_QUALITY,
  LAPORAN_IMAGE_MAX_EDGE_PX,
  LAPORAN_IMAGE_SKIP_COMPRESS_BELOW_BYTES,
  LAPORAN_IMAGE_TARGET_MAX_BYTES,
} from "@/lib/laporan/photos";

export type CompressImageResult = {
  file: File;
  compressed: boolean;
  /** Mesej ringkas untuk UI (BM) */
  notice?: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Mampatkan gambar besar di pelayar sebelum muat naik (JPEG, tepi panjang ≤ 1920px).
 */
export async function compressImageForLaporan(file: File): Promise<CompressImageResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Hanya fail gambar dibenarkan.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const isAlreadySmall =
      file.size <= LAPORAN_IMAGE_SKIP_COMPRESS_BELOW_BYTES &&
      (file.type === "image/jpeg" || file.type === "image/webp");

    if (isAlreadySmall) {
      return { file, compressed: false };
    }

    let width = bitmap.width;
    let height = bitmap.height;
    const maxEdge = Math.max(width, height);

    if (maxEdge > LAPORAN_IMAGE_MAX_EDGE_PX) {
      const scale = LAPORAN_IMAGE_MAX_EDGE_PX / maxEdge;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Pelayar tidak menyokong pemprosesan gambar.");
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    let quality = LAPORAN_IMAGE_JPEG_QUALITY;
    let blob: Blob | null = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });
      if (!blob) {
        throw new Error("Gagal mampatkan gambar.");
      }
      if (blob.size <= LAPORAN_IMAGE_TARGET_MAX_BYTES) break;
      quality -= 0.1;
      if (quality < 0.5) break;
    }

    const baseName = file.name.replace(/\.[^.]+$/i, "") || "gambar";
    const outFile = new File([blob!], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    const notice =
      outFile.size < file.size
        ? `Gambar dimampatkan (${formatBytes(file.size)} → ${formatBytes(outFile.size)}).`
        : "Gambar diseragamkan sebagai JPEG.";

    return { file: outFile, compressed: true, notice };
  } finally {
    bitmap.close();
  }
}
