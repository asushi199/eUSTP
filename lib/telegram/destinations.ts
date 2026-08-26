import "server-only";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramDestinations } from "@/lib/schema";
import {
  KHIDMAT_TELEGRAM_DESTINATION_ID,
  pkgTelegramDestinationId,
} from "./binding";

export type TelegramDestinationRow = {
  id: string;
  chatId: string | null;
  username: string | null;
  boundAt: Date | null;
};

export async function listTelegramDestinations(
  ids: string[],
): Promise<Map<string, TelegramDestinationRow>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      id: telegramDestinations.id,
      chatId: telegramDestinations.chatId,
      username: telegramDestinations.username,
      boundAt: telegramDestinations.boundAt,
    })
    .from(telegramDestinations)
    .where(inArray(telegramDestinations.id, ids));
  return new Map(rows.map((row) => [row.id, row] as const));
}

export async function getTelegramDestinationChatId(
  id: string,
): Promise<string | null> {
  const row = await db.query.telegramDestinations.findFirst({
    columns: { chatId: true },
    where: eq(telegramDestinations.id, id),
  });
  return row?.chatId ?? null;
}

export { KHIDMAT_TELEGRAM_DESTINATION_ID, pkgTelegramDestinationId };
