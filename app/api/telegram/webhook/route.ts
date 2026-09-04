import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pkgs, telegramDestinations, users } from "@/lib/schema";
import {
  hashTelegramBindToken,
  isValidTelegramWebhookSecret,
  parseTelegramStartBindToken,
  telegramDestinationLabel,
} from "@/lib/telegram/binding";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { handleTelegramResourceUpdate } from "@/lib/telegram/resource-upload";

export const runtime = "nodejs";
export const maxDuration = 60;

type TelegramUpdate = {
  message?: {
    message_id?: number;
    message_thread_id?: number;
    text?: string;
    caption?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; username?: string };
    document?: {
      file_id?: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
    photo?: Array<{ file_id?: string; file_size?: number }>;
    reply_to_message?: {
      document?: {
        file_id?: string;
        file_name?: string;
        mime_type?: string;
        file_size?: number;
      };
      photo?: Array<{ file_id?: string; file_size?: number }>;
    };
  };
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number; username?: string };
    message?: {
      message_id?: number;
      message_thread_id?: number;
      chat?: { id?: number; type?: string };
      from?: { id?: number; username?: string };
    };
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
  const token = parseTelegramStartBindToken(message?.text);
  if (message?.chat?.type === "private" && chatId && token) {
    await handleBindToken(String(chatId), token, message.from?.username);
    return NextResponse.json({ ok: true });
  }

  await handleTelegramResourceUpdate(update);
  return NextResponse.json({ ok: true });
}

async function handleBindToken(
  chatId: string,
  token: string,
  username: string | undefined,
): Promise<void> {
  const tokenHash = hashTelegramBindToken(token);
  const user = await db.query.users.findFirst({
    columns: { id: true },
    where: and(
      eq(users.aktif, true),
      eq(users.telegramBindTokenHash, tokenHash),
      gt(users.telegramBindTokenExpiresAt, new Date()),
    ),
  });

  if (user) {
    try {
      await db
        .update(users)
        .set({
          telegramChatId: chatId,
          telegramUsername: username ?? null,
          telegramBoundAt: new Date(),
          telegramBindTokenHash: null,
          telegramBindTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, user.id), eq(users.telegramBindTokenHash, tokenHash)));
      await sendTelegramMessage(
        chatId,
        "Telegram telah disambungkan dengan portal NEXa Manjung. Notifikasi akan dihantar mengikut peranan anda. Cari surat dengan /cari, /ustp, /sekolah atau /spi. Hantar /surat untuk muat naik.",
      );
    } catch {
      await sendTelegramMessage(
        chatId,
        "Akaun Telegram ini tidak dapat disambungkan. Sila hubungi pentadbir sistem.",
      );
    }
    return;
  }

  const destination = await db.query.telegramDestinations.findFirst({
    columns: { id: true },
    where: and(
      eq(telegramDestinations.bindTokenHash, tokenHash),
      gt(telegramDestinations.bindTokenExpiresAt, new Date()),
    ),
  });

  if (!destination) {
    await sendTelegramMessage(
      chatId,
      "Pautan sambungan tidak sah atau telah tamat. Jana pautan baharu dalam portal pentadbir.",
    );
    return;
  }

  try {
    await db
      .update(telegramDestinations)
      .set({
        chatId,
        username: username ?? null,
        boundAt: new Date(),
        bindTokenHash: null,
        bindTokenExpiresAt: null,
      })
      .where(
        and(
          eq(telegramDestinations.id, destination.id),
          eq(telegramDestinations.bindTokenHash, tokenHash),
        ),
      );
    const pkgId = destination.id.startsWith("pkg:") ? destination.id.slice(4) : null;
    const pkg = pkgId
      ? await db.query.pkgs.findFirst({
          columns: { name: true },
          where: eq(pkgs.id, pkgId),
        })
      : null;
    await sendTelegramMessage(
      chatId,
      `Telegram telah disambungkan dengan ${telegramDestinationLabel(destination.id, pkg?.name)}. Notifikasi permohonan akan dihantar ke sini.`,
    );
  } catch {
    await sendTelegramMessage(
      chatId,
      "Akaun Telegram ini tidak dapat disambungkan. Sila hubungi pentadbir sistem.",
    );
  }
}
