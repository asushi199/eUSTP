import { createHash, timingSafeEqual } from "crypto";

export const TELEGRAM_BIND_TOKEN_TTL_MS = 10 * 60 * 1000;

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
