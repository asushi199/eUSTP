import {
  extractGooglePhotosUrl,
  isGooglePhotosUrl,
  normalizeGooglePhotosUrl,
} from "@/lib/media/google-photos";
import { parseBotCommandRemainder } from "./commands";

export type TelegramUrlEntity = {
  type?: string;
  offset?: number;
  length?: number;
  url?: string;
};

export type TelegramFotoSource = {
  text?: string;
  caption?: string;
  entities?: TelegramUrlEntity[];
  caption_entities?: TelegramUrlEntity[];
  reply_to_message?: TelegramFotoSource;
};

export function extractGooglePhotosUrlFromRichText(
  text: string | undefined | null,
  entities?: TelegramUrlEntity[] | null,
): string | null {
  const fromText = extractGooglePhotosUrl(text);
  if (fromText) return fromText;
  for (const entity of entities ?? []) {
    if (entity.url && isGooglePhotosUrl(entity.url)) {
      return normalizeGooglePhotosUrl(entity.url);
    }
    if (text && entity.offset != null && entity.length != null && entity.length > 0) {
      const slice = text.substring(entity.offset, entity.offset + entity.length);
      const found = extractGooglePhotosUrl(slice);
      if (found) return found;
    }
  }
  return null;
}

function extractFromMessageBody(message: TelegramFotoSource): string | null {
  return (
    extractGooglePhotosUrlFromRichText(message.text, message.entities) ??
    extractGooglePhotosUrlFromRichText(message.caption, message.caption_entities)
  );
}

/** Ambil pautan Google Photos daripada mesej, kapsyen, entiti, atau mesej yang dibalas. */
export function extractFotoUrl(
  message: TelegramFotoSource,
  includeReply = false,
): string | null {
  return (
    extractGooglePhotosUrl(parseBotCommandRemainder(message.text ?? message.caption)) ??
    extractFromMessageBody(message) ??
    (includeReply && message.reply_to_message
      ? extractFromMessageBody(message.reply_to_message)
      : null)
  );
}
