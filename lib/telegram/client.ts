import "server-only";

type TelegramButton = {
  text: string;
  url: string;
};

export type TelegramInlineKeyboard = Array<
  Array<{ text: string; url?: string; callback_data?: string }>
>;

type TelegramApiResult = {
  ok?: boolean;
  description?: string;
  result?: { message_id?: number; file_path?: string; file_size?: number };
};

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
}

export function getTelegramBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export function getTelegramBotUsername(): string {
  return (process.env.TELEGRAM_BOT_USERNAME ?? "").trim().replace(/^@/, "");
}

async function telegramApi(
  method: string,
  body: Record<string, unknown>,
  timeoutMs = 8_000,
): Promise<TelegramApiResult | null> {
  const token = getTelegramBotToken();
  if (!token) return null;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return (await response.json()) as TelegramApiResult;
  } catch {
    return null;
  }
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  button?: TelegramButton,
): Promise<boolean> {
  const result = await sendTelegramChatMessage(chatId, text, {
    replyMarkup: button
      ? { inline_keyboard: [[{ text: button.text, url: button.url }]] }
      : undefined,
  });
  return result.ok;
}

export async function sendTelegramChatMessage(
  chatId: string,
  text: string,
  opts?: {
    replyMarkup?: { inline_keyboard: TelegramInlineKeyboard };
    replyToMessageId?: number;
    messageThreadId?: number;
  },
): Promise<{ ok: boolean; messageId?: number }> {
  if (!chatId || !text) return { ok: false };
  const result = await telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    link_preview_options: { is_disabled: true },
    ...(opts?.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
    ...(opts?.replyToMessageId
      ? {
          reply_to_message_id: opts.replyToMessageId,
          allow_sending_without_reply: true,
        }
      : {}),
    ...(opts?.messageThreadId ? { message_thread_id: opts.messageThreadId } : {}),
  });
  if (!result?.ok) return { ok: false };
  return { ok: true, messageId: result.result?.message_id };
}

export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string,
  replyMarkup?: { inline_keyboard: TelegramInlineKeyboard },
): Promise<boolean> {
  const result = await telegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    link_preview_options: { is_disabled: true },
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
  return result?.ok === true;
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

export async function getTelegramFilePath(fileId: string): Promise<string | null> {
  const result = await telegramApi("getFile", { file_id: fileId }, 12_000);
  return result?.ok ? result.result?.file_path ?? null : null;
}

export async function downloadTelegramFile(filePath: string): Promise<Buffer | null> {
  const token = getTelegramBotToken();
  if (!token || !filePath) return null;
  try {
    const response = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function deleteTelegramMessage(
  chatId: string,
  messageId: number,
): Promise<boolean> {
  if (!chatId || !messageId) return false;
  const result = await telegramApi("deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  });
  return result?.ok === true;
}

export async function deleteTelegramMessages(
  chatId: string,
  messageIds: Array<number | null | undefined>,
): Promise<void> {
  const unique = [
    ...new Set(messageIds.filter((id): id is number => typeof id === "number" && id > 0)),
  ];
  await Promise.all(unique.map((id) => deleteTelegramMessage(chatId, id)));
}
