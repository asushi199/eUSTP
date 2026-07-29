import "server-only";

import {
  createCipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";

function encryptionSecret(): string {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("Kunci keselamatan aplikasi belum dikonfigurasi.");
  }
  return secret;
}

function encryptionKey(): Buffer {
  return createHash("sha256")
    .update(`eustp:equipment-mykad:v1:${encryptionSecret()}`)
    .digest();
}

export function normalizeMykad(value: string): string {
  return value.replace(/\D/g, "");
}

export function encryptMykad(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function hashAuditValue(value: string): string {
  if (!value) return "";
  return createHmac("sha256", encryptionSecret())
    .update(value)
    .digest("hex");
}

export function maskMykad(lastFour: string | null): string {
  return lastFour ? `******-**-${lastFour}` : "Belum direkodkan";
}
