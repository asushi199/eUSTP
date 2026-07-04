/** Token kelulusan tempahan — diporting verbatim dari tempahan-pkg-manjung. */

import { createHash, randomBytes, timingSafeEqual } from "crypto";

function getApprovalSecret() {
  return process.env.ADMIN_SESSION_SECRET || "tempahan-dev-secret";
}

export async function hashApprovalToken(bookingId: string, token: string) {
  return createHash("sha256")
    .update(`${bookingId}:${token}:${getApprovalSecret()}`)
    .digest("hex");
}

export async function createApprovalToken(bookingId: string) {
  const token = randomBytes(32).toString("base64url");
  const hash = await hashApprovalToken(bookingId, token);
  return { token, hash };
}

export async function verifyApprovalToken(
  bookingId: string,
  token: string,
  expectedHash: string | null,
) {
  if (!token || !expectedHash) return false;

  const actualHash = await hashApprovalToken(bookingId, token);
  const actual = Buffer.from(actualHash);
  const expected = Buffer.from(expectedHash);

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function generateAttendanceToken() {
  return randomBytes(16).toString("base64url");
}
