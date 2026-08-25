"use server";

import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { users } from "@/lib/schema";
import {
  hashTelegramBindToken,
  TELEGRAM_BIND_TOKEN_TTL_MS,
} from "@/lib/telegram/binding";

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
