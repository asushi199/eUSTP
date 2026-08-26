import "server-only";

import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { pkgs, users } from "@/lib/schema";
import { isTelegramConfigured, sendTelegramMessage } from "./client";
import { resolveTelegramRecipientChatIds } from "./recipients";

type Notification = {
  text: string;
  actionUrl: string;
};

async function sendToChats(chatIds: string[], notification: Notification): Promise<number> {
  if (!isTelegramConfigured() || chatIds.length === 0) return 0;
  const results = await Promise.all(
    [...new Set(chatIds)].map((chatId) =>
      sendTelegramMessage(chatId, notification.text, {
        text: "Semak permohonan",
        url: notification.actionUrl,
      }),
    ),
  );
  return results.filter(Boolean).length;
}

async function getPkgRecipientChatIds(pkgId: string): Promise<string[]> {
  const configuredRows = await db
    .select({ chatId: users.telegramChatId })
    .from(pkgs)
    .innerJoin(users, eq(pkgs.telegramResponsibleUserId, users.id))
    .where(
      and(
        eq(pkgs.id, pkgId),
        eq(users.aktif, true),
        isNotNull(users.telegramChatId),
      ),
    );
  const legacyRows = await db
    .select({ chatId: users.telegramChatId })
    .from(users)
    .where(
      and(
        eq(users.aktif, true),
        eq(users.peranan, "PKG_Admin"),
        eq(users.pkgId, pkgId),
        isNotNull(users.telegramChatId),
      ),
    );
  return resolveTelegramRecipientChatIds(
    configuredRows[0]?.chatId ?? null,
    legacyRows.flatMap((row) => (row.chatId ? [row.chatId] : [])),
  );
}

async function getKhidmatRecipientChatIds(): Promise<string[]> {
  const { getKhidmatBantuTelegramResponsibleUserId } = await import(
    "@/lib/khidmat-bantu/queries"
  );
  const configuredUserId = await getKhidmatBantuTelegramResponsibleUserId();
  const configuredRows = configuredUserId
    ? await db
        .select({ chatId: users.telegramChatId })
        .from(users)
        .where(
          and(
            eq(users.id, configuredUserId),
            eq(users.aktif, true),
            isNotNull(users.telegramChatId),
          ),
        )
    : [];
  const legacyRows = await db
    .select({ chatId: users.telegramChatId })
    .from(users)
    .where(
      and(
        eq(users.aktif, true),
        inArray(users.peranan, ["Admin", "Pegawai"]),
        isNotNull(users.telegramChatId),
      ),
    );
  return resolveTelegramRecipientChatIds(
    configuredRows[0]?.chatId ?? null,
    legacyRows.flatMap((row) => (row.chatId ? [row.chatId] : [])),
  );
}

export async function notifyPkgAdministrators(
  pkgId: string,
  notification: Notification,
): Promise<number> {
  try {
    return await sendToChats(await getPkgRecipientChatIds(pkgId), notification);
  } catch {
    return 0;
  }
}

export async function notifyKhidmatAdministrators(
  notification: Notification,
): Promise<number> {
  try {
    return await sendToChats(await getKhidmatRecipientChatIds(), notification);
  } catch {
    return 0;
  }
}
