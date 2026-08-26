"use server";

import { randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { KHIDMAT_BANTU_TELEGRAM_USER_ID_KEY } from "@/lib/khidmat-bantu/config";
import { listKhidmatBantuTelegramResponsibleUsers } from "@/lib/khidmat-bantu/queries";
import { db } from "@/lib/db";
import { requireKandunganAccess, requireTempahanAccess, requireUser } from "@/lib/rbac";
import { appSettings, pkgs, users } from "@/lib/schema";
import { listPkgTelegramResponsibleUsers } from "@/lib/tempahan/queries";
import {
  hashTelegramBindToken,
  TELEGRAM_BIND_TOKEN_TTL_MS,
} from "@/lib/telegram/binding";
import { parseTelegramResponsibleUserId } from "@/lib/telegram/recipients";

export type TelegramBindingActionResult = {
  ok: boolean;
  url?: string;
  error?: string;
};

function getBotUsername(): string {
  return (process.env.TELEGRAM_BOT_USERNAME ?? "").trim().replace(/^@/, "");
}

export async function createTelegramBindingLink(): Promise<TelegramBindingActionResult> {
  const sessionUser = await requireUser();
  const botUsername = getBotUsername();
  if (
    !process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    !process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ||
    !/^[A-Za-z0-9_]{5,32}$/.test(botUsername)
  ) {
    return {
      ok: false,
      error: "Telegram Bot belum dikonfigurasi oleh pentadbir sistem.",
    };
  }

  const token = randomBytes(24).toString("base64url");
  await db
    .update(users)
    .set({
      telegramBindTokenHash: hashTelegramBindToken(token),
      telegramBindTokenExpiresAt: new Date(Date.now() + TELEGRAM_BIND_TOKEN_TTL_MS),
      updatedAt: new Date(),
    })
    .where(eq(users.id, Number(sessionUser.id)));

  return {
    ok: true,
    url: `https://t.me/${botUsername}?start=bind_${token}`,
  };
}

export async function disconnectTelegram(): Promise<void> {
  const sessionUser = await requireUser();
  await db
    .update(users)
    .set({
      telegramChatId: null,
      telegramUsername: null,
      telegramBoundAt: null,
      telegramBindTokenHash: null,
      telegramBindTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, Number(sessionUser.id)));
  revalidatePath("/admin/telegram");
}

export async function saveTelegramResponsible(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = parseTelegramResponsibleUserId(
    String(formData.get("telegramResponsibleUserId") ?? ""),
  );
  if (!parsed.ok) {
    return { ok: false, error: "Pegawai Telegram tidak sah." };
  }

  const scope = String(formData.get("scope") ?? "").trim();
  if (scope === "khidmat") {
    await requireKandunganAccess();
    if (parsed.userId !== null) {
      const eligibleUsers = await listKhidmatBantuTelegramResponsibleUsers();
      if (!eligibleUsers.some((user) => user.id === parsed.userId)) {
        return {
          ok: false,
          error: "Pegawai yang dipilih tidak mempunyai akses Khidmat Bantu.",
        };
      }
    }

    const value = parsed.userId === null ? "" : String(parsed.userId);
    await db
      .insert(appSettings)
      .values({ key: KHIDMAT_BANTU_TELEGRAM_USER_ID_KEY, value })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedAt: sql`now()` },
      });
    revalidatePath("/admin/telegram");
    revalidatePath("/admin/khidmat-bantu/tetapan");
    return { ok: true };
  }

  if (scope === "pkg") {
    const pkgId = String(formData.get("pkgId") ?? "").trim();
    if (!pkgId) return { ok: false, error: "PKG tidak sah." };
    await requireTempahanAccess(pkgId);
    if (parsed.userId !== null) {
      const eligibleUsers = await listPkgTelegramResponsibleUsers(pkgId);
      if (!eligibleUsers.some((user) => user.id === parsed.userId)) {
        return {
          ok: false,
          error: "Pegawai yang dipilih tidak mempunyai akses kepada PKG ini.",
        };
      }
    }

    await db
      .update(pkgs)
      .set({ telegramResponsibleUserId: parsed.userId })
      .where(eq(pkgs.id, pkgId));
    revalidatePath("/admin/telegram");
    revalidatePath(`/admin/tempahan/${pkgId}/tetapan`);
    return { ok: true };
  }

  return { ok: false, error: "Tetapan tidak sah." };
}
