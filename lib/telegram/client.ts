import "server-only";

type TelegramButton = {
  text: string;
  url: string;
};

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  button?: TelegramButton,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || !chatId || !text) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        link_preview_options: { is_disabled: true },
        ...(button
          ? {
              reply_markup: {
                inline_keyboard: [[{ text: button.text, url: button.url }]],
              },
            }
          : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { ok?: boolean };
    return result.ok === true;
  } catch {
    return false;
  }
}
