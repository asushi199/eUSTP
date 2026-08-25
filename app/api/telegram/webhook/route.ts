import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import {
  hashTelegramBindToken,
  isValidTelegramWebhookSecret,
} from "@/lib/telegram/binding";
import { sendTelegramMessage } from "@/lib/telegram/client";

export const runtime = "nodejs";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; username?: string };
  };
};

export async function POST(request: Request) {
  if (
    !isValidTelegramWebhookSecret(
      request.headers.get("x-telegram-bot-api-secret-token"),
      process.env.TELEGRAM_WEBHOOK_SECRET,
    )
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  const match = message?.text?.match(/^\/start\s+bind_([A-Za-z0-9_-]{32})$/);
  if (message?.chat?.type !== "private" || !chatId || !match) {
    return NextResponse.json({ ok: true });
  }

  const tokenHash = hashTelegramBindToken(match[1]);
  const user = await db.query.users.findFirst({
    columns: { id: true },
    where: and(
      eq(users.aktif, true),
      eq(users.telegramBindTokenHash, tokenHash),
      gt(users.telegramBindTokenExpiresAt, new Date()),
    ),
  });

  if (!user) {
    await sendTelegramMessage(
      String(chatId),
      "Pautan sambungan tidak sah atau telah tamat. Jana pautan baharu dalam portal pentadbir.",
    );
    return NextResponse.json({ ok: true });
  }

  try {
    await db
      .update(users)
      .set({
        telegramChatId: String(chatId),
        telegramUsername: message?.from?.username ?? null,
        telegramBoundAt: new Date(),
        telegramBindTokenHash: null,
        telegramBindTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, user.id), eq(users.telegramBindTokenHash, tokenHash)));
    await sendTelegramMessage(
      String(chatId),
      "Telegram telah disambungkan dengan portal NEXa Manjung. Notifikasi akan dihantar mengikut peranan anda.",
    );
  } catch {
    await sendTelegramMessage(
      String(chatId),
      "Akaun Telegram ini tidak dapat disambungkan. Sila hubungi pentadbir sistem.",
    );
  }

  return NextResponse.json({ ok: true });
}
