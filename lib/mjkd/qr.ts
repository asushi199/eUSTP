import "server-only";

import QRCode from "qrcode";

/** Kod QR sebagai data URL PNG (kontras tinggi, margin cukup untuk imbasan jauh). */
export async function qrDataUrl(nilai: string, lebar = 1024): Promise<string> {
  return QRCode.toDataURL(nilai, {
    width: lebar,
    margin: 3,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}
