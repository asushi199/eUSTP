import { createHash, timingSafeEqual } from "crypto";

export const TELEGRAM_BIND_TOKEN_TTL_MS = 10 * 60 * 1000;
export const KHIDMAT_TELEGRAM_DESTINATION_ID = "khidmat";

export function pkgTelegramDestinationId(pkgId: string): string {
  return `pkg:${pkgId}`;
}

export function telegramDestinationLabel(
  id: string,
  pkgName?: string | null,
): string {
  if (id === KHIDMAT_TELEGRAM_DESTINATION_ID) return "Khidmat Bantu";
  return pkgName ? `Admin ${pkgName}` : "modul yang dipilih";
}

export function parseTelegramStartBindToken(text: string | undefined): string | null {
  const match = text?.match(/^\/start\s+bind_([A-Za-z0-9_-]{32})$/);
  return match?.[1] ?? null;
}

export function hashTelegramBindToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidTelegramWebhookSecret(
  actual: string | null,
  expected: string | undefined,
): boolean {
  if (!actual || !expected) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
