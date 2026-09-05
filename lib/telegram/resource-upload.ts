import "server-only";

import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { isGasStorageConfigured } from "@/lib/gas-upload";
import { resolveSuratMime } from "@/lib/khidmat-bantu/surat-mime";
import { telegramResourceDrafts, users } from "@/lib/schema";
import { isLetterMonthKey } from "@/lib/resources/drive-path";
import {
  isResourcesBotKategori,
  resourcesHref,
  resourcesKategoriBySlug,
  type ResourcesBotKategoriSlug,
} from "@/lib/resources/kategori";
import { publishResourcesFile, removeResourcesCard, updateResourcesCardMeta } from "@/lib/resources/publish";
import { getResourcesCard, listResourcesCardsGrouped } from "@/lib/resources/queries";
import {
  filterResourceCards,
  formatResourceMonthLabel,
  toResourcesExplorerGroups,
} from "@/lib/resources/search";
import { getMediaCard } from "@/lib/media/queries";
import { publishMediaLink, removeMediaCard, updateMediaCardMeta } from "@/lib/media/publish";
import { extractGooglePhotosUrl, fetchGooglePhotosAlbumTitle } from "@/lib/media/google-photos";
import { extractFotoUrl } from "./foto-url";
import { mediaHref } from "@/lib/media/kategori";
import { canManageKandungan } from "@/lib/roles";
import {
  draftCardIdFromFileId,
  draftFileIdForCard,
  draftFileIdForMediaCard,
  draftMediaCardIdFromFileId,
  isFotoDraftStep,
  MEDIA_FOTO_COMMANDS,
  MEDIA_FOTO_KATEGORI,
  parseBotCommand,
  parseBotCommandRemainder,
  parseMediaFotoCallback,
  parseResourceCallback,
  RESOURCE_HELP_COMMANDS,
  RESOURCE_MANAGE_COMMANDS,
  RESOURCE_SEARCH_COMMANDS,
  type MediaFotoCallback,
  type ResourceCallback,
} from "./commands";
import {
    formatResourceManageList,
    formatResourceSearchReply,
    nexaBotHelpText,
    parseResourceSearchCallback,
  parseResourceSearchIntent,
  RESOURCE_MANAGE_LIMIT,
  RESOURCE_SEARCH_LIMIT,
  resourceSearchPageKeyboard,
  sortResourceSearchHits,
} from "./resource-search-format";
import { extractTelegramResourceFile } from "./resource-file";
import {
  answerTelegramCallback,
  deleteTelegramMessages,
  downloadTelegramFile,
  editTelegramMessage,
  getTelegramBotUsername,
  getTelegramFilePath,
  sendTelegramChatMessage,
} from "./client";
import {
  askFilePrompt,
  askFotoUrlPrompt,
  cancelKeyboard,
  fotoMonthPrompt,
  fotoTitleKeyboard,
  fotoTitlePrompt,
  kategoriKeyboard,
  kategoriPrompt,
  mediaDeleteConfirmKeyboard,
  mediaSavedKeyboard,
  monthKeyboard,
  monthPrompt,
  resourceDeleteConfirmKeyboard,
  resourceManageRow,
  resourceSavedKeyboard,
  titlePrompt,
} from "./resource-keyboard";

export const RESOURCE_DRAFT_TTL_MS = 30 * 60 * 1000;
const MAX_BYTES = 8 * 1024 * 1024;

type TelegramUser = { id?: number; username?: string };
type TelegramChat = { id?: number; type?: string };
type TelegramDocument = {
  file_id?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};
type TelegramPhoto = { file_id?: string; file_size?: number };

export type TelegramResourceMessage = {
  message_id?: number;
  message_thread_id?: number;
  chat?: TelegramChat;
  from?: TelegramUser;
  text?: string;
  caption?: string;
  entities?: Array<{ type?: string; offset?: number; length?: number; url?: string }>;
  caption_entities?: Array<{ type?: string; offset?: number; length?: number; url?: string }>;
  document?: TelegramDocument;
  photo?: TelegramPhoto[];
  reply_to_message?: TelegramResourceMessage;
};

export type TelegramResourceCallback = {
  id?: string;
  from?: TelegramUser;
  data?: string;
  message?: TelegramResourceMessage;
};

export type TelegramResourceUpdate = {
  message?: TelegramResourceMessage;
  callback_query?: TelegramResourceCallback;
};

type DraftRow = typeof telegramResourceDrafts.$inferSelect;
type StaffRow = { id: number; peranan: typeof users.$inferSelect.peranan };

function portalBaseUrl(): string {
  return (process.env.APP_BASE_URL ?? "").trim().replace(/\/$/, "");
}

function portalUrlFor(kategori: string): string | null {
  const portal = portalBaseUrl();
  return portal ? `${portal}${resourcesHref(kategori)}` : null;
}

function suggestedFotoTitle(draft: DraftRow): string | null {
  const title = draft.mimeType?.trim();
  return title ? title.slice(0, 300) : null;
}

function mediaPortalUrl(kategori = MEDIA_FOTO_KATEGORI): string | null {
  const portal = portalBaseUrl();
  return portal ? `${portal}${mediaHref(kategori)}` : null;
}

function cardStatusText(
  prefix: string,
  card: { title: string; kategori: string; letterMonth?: string | null },
): string {
  const kategori = resourcesKategoriBySlug(card.kategori);
  return [
    prefix,
    "",
    `Tajuk: ${card.title}`,
    `Kumpulan: ${kategori?.title ?? card.kategori}`,
    card.letterMonth ? `Bulan: ${formatResourceMonthLabel(card.letterMonth)}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function isGroupChat(type: string | undefined): boolean {
  return type === "group" || type === "supergroup";
}

function threadIdOf(message?: TelegramResourceMessage): number | undefined {
  return typeof message?.message_thread_id === "number" ? message.message_thread_id : undefined;
}

function extractFile(
  message: TelegramResourceMessage,
  includeReply = false,
) {
  return extractTelegramResourceFile(message, { includeReply });
}

function mediaCardStatusText(
  prefix: string,
  card: { title: string; letterMonth?: string | null },
): string {
  return [
    prefix,
    "",
    `Nama aktiviti: ${card.title}`,
    card.letterMonth ? `Bulan: ${formatResourceMonthLabel(card.letterMonth)}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

async function findStaffByTelegramUserId(telegramUserId: string): Promise<StaffRow | null> {
  const user = await db.query.users.findFirst({
    columns: { id: true, peranan: true },
    where: and(eq(users.aktif, true), eq(users.telegramChatId, telegramUserId)),
  });
  if (!user || !canManageKandungan(user.peranan)) return null;
  return user;
}

async function findDraft(chatId: string, telegramUserId: string): Promise<DraftRow | null> {
  const row = await db.query.telegramResourceDrafts.findFirst({
    where: and(
      eq(telegramResourceDrafts.chatId, chatId),
      eq(telegramResourceDrafts.telegramUserId, telegramUserId),
    ),
  });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await clearDraft(chatId, telegramUserId);
    return null;
  }
  return row;
}

async function clearDraft(chatId: string, telegramUserId: string): Promise<void> {
  await db
    .delete(telegramResourceDrafts)
    .where(
      and(
        eq(telegramResourceDrafts.chatId, chatId),
        eq(telegramResourceDrafts.telegramUserId, telegramUserId),
      ),
    );
}

async function clearExpiredDrafts(): Promise<void> {
  await db
    .delete(telegramResourceDrafts)
    .where(lt(telegramResourceDrafts.expiresAt, new Date()));
}

async function upsertDraft(
  values: Omit<typeof telegramResourceDrafts.$inferInsert, "id" | "createdAt" | "expiresAt">,
): Promise<void> {
  const expiresAt = new Date(Date.now() + RESOURCE_DRAFT_TTL_MS);
  const existing = await db.query.telegramResourceDrafts.findFirst({
    columns: { id: true },
    where: and(
      eq(telegramResourceDrafts.chatId, values.chatId),
      eq(telegramResourceDrafts.telegramUserId, values.telegramUserId),
    ),
  });
  if (existing) {
    await db
      .update(telegramResourceDrafts)
      .set({ ...values, expiresAt })
      .where(eq(telegramResourceDrafts.id, existing.id));
    return;
  }
  await db.insert(telegramResourceDrafts).values({ ...values, expiresAt });
}

async function reply(
  chatId: string,
  text: string,
  keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>,
  extra?: { replyToMessageId?: number; messageThreadId?: number },
): Promise<number | undefined> {
  const sent = await sendTelegramChatMessage(chatId, text, {
    replyMarkup: keyboard ? { inline_keyboard: keyboard } : undefined,
    replyToMessageId: extra?.replyToMessageId,
    messageThreadId: extra?.messageThreadId,
  });
  return sent.messageId;
}

function fileError(file: NonNullable<ReturnType<typeof extractFile>>): string | null {
  if (file.fileSize != null && file.fileSize > MAX_BYTES) {
    return "Fail melebihi 8 MB. Sila hantar PDF atau imej yang lebih kecil.";
  }
  if (!resolveSuratMime(file.fileName, file.mimeType)) {
    return "Format tidak disokong. Sila hantar PDF atau imej (JPG/PNG/WebP).";
  }
  return null;
}

async function startFromFile(opts: {
  chatId: string;
  telegramUserId: string;
  userId: number;
  file: NonNullable<ReturnType<typeof extractFile>>;
  replyToMessageId?: number;
  messageThreadId?: number;
}): Promise<void> {
  const err = fileError(opts.file);
  if (err) {
    await reply(opts.chatId, err, undefined, { messageThreadId: opts.messageThreadId });
    return;
  }
  const previous = await findDraft(opts.chatId, opts.telegramUserId);
  if (previous?.promptMessageId) {
    await deleteTelegramMessages(opts.chatId, [previous.promptMessageId]);
  }
  const promptMessageId = await reply(
    opts.chatId,
    kategoriPrompt(opts.file.fileName),
    kategoriKeyboard(),
    { replyToMessageId: opts.replyToMessageId, messageThreadId: opts.messageThreadId },
  );
  await upsertDraft({
    chatId: opts.chatId,
    telegramUserId: opts.telegramUserId,
    userId: opts.userId,
    fileId: opts.file.fileId,
    fileName: opts.file.fileName,
    mimeType: resolveSuratMime(opts.file.fileName, opts.file.mimeType) ?? opts.file.mimeType,
    fileSize: opts.file.fileSize,
    step: "kategori",
    kategori: null,
    letterMonth: null,
    promptMessageId: promptMessageId ?? null,
  });
}

async function startFromFotoUrl(opts: {
  chatId: string;
  telegramUserId: string;
  userId: number;
  url: string;
  replyToMessageId?: number;
  messageThreadId?: number;
}): Promise<void> {
  const previous = await findDraft(opts.chatId, opts.telegramUserId);
  if (previous?.promptMessageId) {
    await deleteTelegramMessages(opts.chatId, [previous.promptMessageId]);
  }
  const albumTitle = await fetchGooglePhotosAlbumTitle(opts.url);
  const promptMessageId = await reply(
    opts.chatId,
    fotoMonthPrompt(albumTitle),
    monthKeyboard(),
    { replyToMessageId: opts.replyToMessageId, messageThreadId: opts.messageThreadId },
  );
  await upsertDraft({
    chatId: opts.chatId,
    telegramUserId: opts.telegramUserId,
    userId: opts.userId,
    fileId: null,
    fileName: opts.url,
    mimeType: albumTitle,
    fileSize: null,
    step: "foto_bulan",
    kategori: MEDIA_FOTO_KATEGORI,
    letterMonth: null,
    promptMessageId: promptMessageId ?? null,
  });
}

async function publishDraft(opts: {
  chatId: string;
  telegramUserId: string;
  draft: DraftRow;
  title: string;
  titleMessageId?: number;
  messageThreadId?: number;
}): Promise<void> {
  const thread = opts.messageThreadId;
  const title = opts.title.trim().slice(0, 300);
  if (!title) {
    await reply(opts.chatId, "Sila taip nama surat.", cancelKeyboard(), { messageThreadId: thread });
    return;
  }
  if (
    !opts.draft.fileId ||
    !opts.draft.fileName ||
    !opts.draft.kategori ||
    !opts.draft.letterMonth ||
    !isResourcesBotKategori(opts.draft.kategori) ||
    !isLetterMonthKey(opts.draft.letterMonth)
  ) {
    await clearDraft(opts.chatId, opts.telegramUserId);
    await reply(opts.chatId, "Draf tidak lengkap. Hantar /surat semula.", undefined, {
      messageThreadId: thread,
    });
    return;
  }
  if (!isGasStorageConfigured()) {
    await reply(
      opts.chatId,
      "Google Drive belum dikonfigurasi. Sila muat naik melalui pentadbir sistem.",
      undefined,
      { messageThreadId: thread },
    );
    return;
  }

  const uploading = await sendTelegramChatMessage(opts.chatId, "Sedang memuat naik ke Google Drive…", {
    messageThreadId: thread,
  });
  const filePath = await getTelegramFilePath(opts.draft.fileId);
  const buffer = filePath ? await downloadTelegramFile(filePath) : null;
  if (!buffer) {
    await reply(
      opts.chatId,
      "Gagal memuat turun fail daripada Telegram. Hantar fail itu sekali lagi.",
      undefined,
      { messageThreadId: thread },
    );
    return;
  }

  try {
    const published = await publishResourcesFile({
      kategori: opts.draft.kategori,
      title,
      letterMonth: opts.draft.letterMonth,
      file: {
        name: opts.draft.fileName,
        type: opts.draft.mimeType || "",
        buffer,
      },
    });
    await clearDraft(opts.chatId, opts.telegramUserId);
    const successText = cardStatusText("Surat telah disimpan.", {
      title,
      kategori: opts.draft.kategori,
      letterMonth: opts.draft.letterMonth,
    });
    const successMarkup = {
      inline_keyboard: resourceSavedKeyboard({
        cardId: published.id,
        driveUrl: published.url,
        portalUrl: portalUrlFor(opts.draft.kategori),
      }),
    };

    let successOnUploading = false;
    if (uploading.messageId) {
      successOnUploading = await editTelegramMessage(
        opts.chatId,
        uploading.messageId,
        successText,
        successMarkup,
      );
    }
    if (!successOnUploading) {
      await sendTelegramChatMessage(opts.chatId, successText, {
        replyMarkup: successMarkup,
        messageThreadId: thread,
      });
    }

    await deleteTelegramMessages(opts.chatId, [
      opts.draft.promptMessageId,
      opts.titleMessageId,
      successOnUploading ? null : uploading.messageId,
    ]);
  } catch (error) {
    await reply(
      opts.chatId,
      error instanceof Error
        ? `Gagal memuat naik: ${error.message}`
        : "Gagal memuat naik surat. Sila cuba lagi.",
      undefined,
      { messageThreadId: thread },
    );
  }
}

async function publishFotoDraft(opts: {
  chatId: string;
  telegramUserId: string;
  draft: DraftRow;
  title: string;
  titleMessageId?: number;
  messageThreadId?: number;
}): Promise<void> {
  const thread = opts.messageThreadId;
  const title = opts.title.trim().slice(0, 300);
  if (!title) {
    await reply(opts.chatId, "Sila taip nama aktiviti.", cancelKeyboard(), {
      messageThreadId: thread,
    });
    return;
  }
  if (
    !opts.draft.fileName ||
    !opts.draft.letterMonth ||
    !extractGooglePhotosUrl(opts.draft.fileName) ||
    !isLetterMonthKey(opts.draft.letterMonth)
  ) {
    await clearDraft(opts.chatId, opts.telegramUserId);
    await reply(opts.chatId, "Draf tidak lengkap. Hantar /foto semula.", undefined, {
      messageThreadId: thread,
    });
    return;
  }

  try {
    const published = await publishMediaLink({
      kategori: MEDIA_FOTO_KATEGORI,
      title,
      url: opts.draft.fileName,
      letterMonth: opts.draft.letterMonth,
    });
    await clearDraft(opts.chatId, opts.telegramUserId);
    await showMediaCardSaved({
      chatId: opts.chatId,
      prefix: "Album gambar telah disimpan.",
      card: {
        id: published.id,
        title,
        url: published.url,
        letterMonth: opts.draft.letterMonth,
      },
      messageThreadId: thread,
    });
    await deleteTelegramMessages(opts.chatId, [opts.draft.promptMessageId, opts.titleMessageId]);
  } catch (error) {
    await reply(
      opts.chatId,
      error instanceof Error
        ? `Gagal menyimpan album: ${error.message}`
        : "Gagal menyimpan album. Sila cuba lagi.",
      undefined,
      { messageThreadId: thread },
    );
  }
}

async function loadSearchHits(intent: { kategori: string | null; query: string }) {
  const groups = toResourcesExplorerGroups(await listResourcesCardsGrouped());
  let cards = groups.flatMap((group) => group.cards);
  if (intent.kategori) {
    cards = cards.filter((card) => card.kategoriSlug === intent.kategori);
  }
  return sortResourceSearchHits(filterResourceCards(cards, { query: intent.query }));
}

async function showCardSaved(opts: {
  chatId: string;
  messageId?: number;
  prefix: string;
  card: { id: number; title: string; kategori: string; letterMonth?: string | null; url: string };
  messageThreadId?: number;
}): Promise<void> {
  const text = cardStatusText(opts.prefix, opts.card);
  const markup = {
    inline_keyboard: resourceSavedKeyboard({
      cardId: opts.card.id,
      driveUrl: opts.card.url,
      portalUrl: portalUrlFor(opts.card.kategori),
    }),
  };
  if (opts.messageId) {
    const edited = await editTelegramMessage(opts.chatId, opts.messageId, text, markup);
    if (edited) return;
  }
  await sendTelegramChatMessage(opts.chatId, text, {
    replyMarkup: markup,
    messageThreadId: opts.messageThreadId,
  });
}

async function showMediaCardSaved(opts: {
  chatId: string;
  messageId?: number;
  prefix: string;
  card: { id: number; title: string; letterMonth?: string | null; url: string };
  messageThreadId?: number;
}): Promise<void> {
  const text = mediaCardStatusText(opts.prefix, opts.card);
  const markup = {
    inline_keyboard: mediaSavedKeyboard({
      cardId: opts.card.id,
      albumUrl: opts.card.url,
      portalUrl: mediaPortalUrl(),
    }),
  };
  if (opts.messageId) {
    const edited = await editTelegramMessage(opts.chatId, opts.messageId, text, markup);
    if (edited) return;
  }
  await sendTelegramChatMessage(opts.chatId, text, {
    replyMarkup: markup,
    messageThreadId: opts.messageThreadId,
  });
}

async function handleManageCommand(opts: {
  chatId: string;
  telegramUserId: string;
  userId: number;
  command: string;
  remainder: string;
  replyToMessageId?: number;
  messageThreadId?: number;
}): Promise<void> {
  const padamOnly = opts.command === "padam";
  const intent = opts.remainder.trim()
    ? parseResourceSearchIntent("cari", opts.remainder)
    : { help: false, kategori: null, query: "" };
  const allHits = (await loadSearchHits({ kategori: intent.kategori, query: intent.query })).filter(
    (card): card is typeof card & { id: number } => typeof card.id === "number",
  );
  const hits = allHits.slice(0, RESOURCE_MANAGE_LIMIT);
  const keyboard = hits.map((card) => resourceManageRow(card.id, padamOnly));
  let text = formatResourceManageList(hits, {
    query: intent.query,
    kategori: intent.kategori,
    padamOnly,
  });
  if (allHits.length > RESOURCE_MANAGE_LIMIT) {
    text += `\n\nMenunjukkan ${RESOURCE_MANAGE_LIMIT} yang terkini. Perhalusi kata carian.`;
  }
  await reply(opts.chatId, text, keyboard.length > 0 ? keyboard : undefined, {
    replyToMessageId: opts.replyToMessageId,
    messageThreadId: opts.messageThreadId,
  });
}

async function beginCardDraft(opts: {
  chatId: string;
  telegramUserId: string;
  userId: number;
  cardId: number;
  step: "ubah_tajuk" | "ubah_bulan";
  promptMessageId?: number | null;
}): Promise<{ ok: true; title: string; kategori: string; letterMonth: string | null } | { ok: false }> {
  const card = await getResourcesCard(opts.cardId);
  if (!card || !card.aktif) return { ok: false };
  await upsertDraft({
    chatId: opts.chatId,
    telegramUserId: opts.telegramUserId,
    userId: opts.userId,
    fileId: draftFileIdForCard(card.id),
    fileName: card.title,
    mimeType: null,
    fileSize: null,
    step: opts.step,
    kategori: card.kategori,
    letterMonth: card.letterMonth,
    promptMessageId: opts.promptMessageId ?? null,
  });
  return {
    ok: true,
    title: card.title,
    kategori: card.kategori,
    letterMonth: card.letterMonth,
  };
}

async function saveEditedTitle(opts: {
  chatId: string;
  telegramUserId: string;
  draft: DraftRow;
  title: string;
  titleMessageId?: number;
  messageThreadId?: number;
}): Promise<void> {
  const cardId = draftCardIdFromFileId(opts.draft.fileId);
  const title = opts.title.trim().slice(0, 300);
  if (!cardId) {
    await clearDraft(opts.chatId, opts.telegramUserId);
    await reply(opts.chatId, "Draf telah tamat. Hantar /kemaskini semula.", undefined, {
      messageThreadId: opts.messageThreadId,
    });
    return;
  }
  if (!title) {
    await reply(opts.chatId, "Sila taip tajuk baharu.", cancelKeyboard(), {
      messageThreadId: opts.messageThreadId,
    });
    return;
  }
  const updated = await updateResourcesCardMeta(cardId, { title });
  const card = await getResourcesCard(cardId);
  await clearDraft(opts.chatId, opts.telegramUserId);
  if (!updated.ok || !card) {
    await reply(opts.chatId, "Surat ini sudah tidak wujud.", undefined, {
      messageThreadId: opts.messageThreadId,
    });
    return;
  }
  await deleteTelegramMessages(opts.chatId, [opts.draft.promptMessageId, opts.titleMessageId]);
  await showCardSaved({
    chatId: opts.chatId,
    prefix: "Tajuk telah dikemas kini.",
    card,
    messageThreadId: opts.messageThreadId,
  });
}

async function handleManageCallback(opts: {
  query: TelegramResourceCallback;
  chatId: string;
  telegramUserId: string;
  staff: StaffRow;
  parsed: Extract<
    ResourceCallback,
    { type: "ubah_tajuk" | "ubah_bulan" | "padam" | "padam_ya" }
  >;
}): Promise<boolean> {
  const callbackId = opts.query.id;
  if (!callbackId) return false;
  const thread = threadIdOf(opts.query.message);
  const messageId = opts.query.message?.message_id;

  if (opts.parsed.type === "ubah_tajuk") {
    const started = await beginCardDraft({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      userId: opts.staff.id,
      cardId: opts.parsed.cardId,
      step: "ubah_tajuk",
      promptMessageId: messageId,
    });
    if (!started.ok) {
      await answerTelegramCallback(callbackId, "Surat tidak wujud.");
      return true;
    }
    await answerTelegramCallback(callbackId);
    const text = [
      cardStatusText("Ubah tajuk surat ini.", started),
      "",
      "Taip tajuk baharu.",
    ].join("\n");
    if (messageId) {
      await editTelegramMessage(opts.chatId, messageId, text, { inline_keyboard: cancelKeyboard() });
    } else {
      await reply(opts.chatId, text, cancelKeyboard(), { messageThreadId: thread });
    }
    return true;
  }

  if (opts.parsed.type === "ubah_bulan") {
    const started = await beginCardDraft({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      userId: opts.staff.id,
      cardId: opts.parsed.cardId,
      step: "ubah_bulan",
      promptMessageId: messageId,
    });
    if (!started.ok) {
      await answerTelegramCallback(callbackId, "Surat tidak wujud.");
      return true;
    }
    await answerTelegramCallback(callbackId);
    const text = monthPrompt(started.kategori);
    const keyboard = monthKeyboard(started.letterMonth ?? undefined);
    if (messageId) {
      await editTelegramMessage(opts.chatId, messageId, text, { inline_keyboard: keyboard });
    } else {
      await reply(opts.chatId, text, keyboard, { messageThreadId: thread });
    }
    return true;
  }

  const card = await getResourcesCard(opts.parsed.cardId);
  if (!card || !card.aktif) {
    await answerTelegramCallback(callbackId, "Surat tidak wujud.");
    return true;
  }

  if (opts.parsed.type === "padam") {
    await answerTelegramCallback(callbackId);
    const text = [
      cardStatusText("Padam surat ini dari portal?", card),
      "",
      "Fail di Google Drive tidak dipadam.",
    ].join("\n");
    if (messageId) {
      await editTelegramMessage(opts.chatId, messageId, text, {
        inline_keyboard: resourceDeleteConfirmKeyboard(card.id),
      });
    } else {
      await reply(opts.chatId, text, resourceDeleteConfirmKeyboard(card.id), {
        messageThreadId: thread,
      });
    }
    return true;
  }

  await removeResourcesCard(card.id);
  await clearDraft(opts.chatId, opts.telegramUserId);
  await answerTelegramCallback(callbackId, "Dipadam");
  const text = "Surat telah dipadam dari portal. Fail di Google Drive masih ada.";
  if (messageId) {
    await editTelegramMessage(opts.chatId, messageId, text, { inline_keyboard: [] });
  } else {
    await reply(opts.chatId, text, undefined, { messageThreadId: thread });
  }
  return true;
}

async function beginMediaCardDraft(opts: {
  chatId: string;
  telegramUserId: string;
  userId: number;
  cardId: number;
  step: "foto_ubah_tajuk" | "foto_ubah_bulan";
  promptMessageId?: number | null;
}): Promise<
  { ok: true; title: string; url: string; letterMonth: string | null } | { ok: false }
> {
  const card = await getMediaCard(opts.cardId);
  if (!card || !card.aktif) return { ok: false };
  await upsertDraft({
    chatId: opts.chatId,
    telegramUserId: opts.telegramUserId,
    userId: opts.userId,
    fileId: draftFileIdForMediaCard(card.id),
    fileName: card.url,
    mimeType: null,
    fileSize: null,
    step: opts.step,
    kategori: card.kategori,
    letterMonth: card.letterMonth,
    promptMessageId: opts.promptMessageId ?? null,
  });
  return {
    ok: true,
    title: card.title,
    url: card.url,
    letterMonth: card.letterMonth,
  };
}

async function saveEditedMediaTitle(opts: {
  chatId: string;
  telegramUserId: string;
  draft: DraftRow;
  title: string;
  titleMessageId?: number;
  messageThreadId?: number;
}): Promise<void> {
  const cardId = draftMediaCardIdFromFileId(opts.draft.fileId);
  const title = opts.title.trim().slice(0, 300);
  if (!cardId) {
    await clearDraft(opts.chatId, opts.telegramUserId);
    await reply(opts.chatId, "Draf telah tamat. Hantar /foto semula.", undefined, {
      messageThreadId: opts.messageThreadId,
    });
    return;
  }
  if (!title) {
    await reply(opts.chatId, "Sila taip nama aktiviti baharu.", cancelKeyboard(), {
      messageThreadId: opts.messageThreadId,
    });
    return;
  }
  const updated = await updateMediaCardMeta(cardId, { title });
  const card = await getMediaCard(cardId);
  await clearDraft(opts.chatId, opts.telegramUserId);
  if (!updated.ok || !card) {
    await reply(opts.chatId, "Album ini sudah tidak wujud.", undefined, {
      messageThreadId: opts.messageThreadId,
    });
    return;
  }
  await deleteTelegramMessages(opts.chatId, [opts.draft.promptMessageId, opts.titleMessageId]);
  await showMediaCardSaved({
    chatId: opts.chatId,
    prefix: "Nama aktiviti telah dikemas kini.",
    card,
    messageThreadId: opts.messageThreadId,
  });
}

async function handleMediaManageCallback(opts: {
  query: TelegramResourceCallback;
  chatId: string;
  telegramUserId: string;
  staff: StaffRow;
  parsed: Exclude<MediaFotoCallback, { type: "guna_tajuk" }>;
}): Promise<boolean> {
  const callbackId = opts.query.id;
  if (!callbackId) return false;
  const thread = threadIdOf(opts.query.message);
  const messageId = opts.query.message?.message_id;

  if (opts.parsed.type === "ubah_tajuk") {
    const started = await beginMediaCardDraft({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      userId: opts.staff.id,
      cardId: opts.parsed.cardId,
      step: "foto_ubah_tajuk",
      promptMessageId: messageId,
    });
    if (!started.ok) {
      await answerTelegramCallback(callbackId, "Album tidak wujud.");
      return true;
    }
    await answerTelegramCallback(callbackId);
    const text = [
      mediaCardStatusText("Ubah nama aktiviti ini.", started),
      "",
      "Taip nama aktiviti baharu.",
    ].join("\n");
    if (messageId) {
      await editTelegramMessage(opts.chatId, messageId, text, { inline_keyboard: cancelKeyboard() });
    } else {
      await reply(opts.chatId, text, cancelKeyboard(), { messageThreadId: thread });
    }
    return true;
  }

  if (opts.parsed.type === "ubah_bulan") {
    const started = await beginMediaCardDraft({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      userId: opts.staff.id,
      cardId: opts.parsed.cardId,
      step: "foto_ubah_bulan",
      promptMessageId: messageId,
    });
    if (!started.ok) {
      await answerTelegramCallback(callbackId, "Album tidak wujud.");
      return true;
    }
    await answerTelegramCallback(callbackId);
    const text = fotoMonthPrompt();
    const keyboard = monthKeyboard(started.letterMonth ?? undefined);
    if (messageId) {
      await editTelegramMessage(opts.chatId, messageId, text, { inline_keyboard: keyboard });
    } else {
      await reply(opts.chatId, text, keyboard, { messageThreadId: thread });
    }
    return true;
  }

  const card = await getMediaCard(opts.parsed.cardId);
  if (!card || !card.aktif) {
    await answerTelegramCallback(callbackId, "Album tidak wujud.");
    return true;
  }

  if (opts.parsed.type === "padam") {
    await answerTelegramCallback(callbackId);
    const text = [
      mediaCardStatusText("Padam album ini dari CoE Media?", card),
      "",
      "Pautan Google Photos tidak dipadam.",
    ].join("\n");
    if (messageId) {
      await editTelegramMessage(opts.chatId, messageId, text, {
        inline_keyboard: mediaDeleteConfirmKeyboard(card.id),
      });
    } else {
      await reply(opts.chatId, text, mediaDeleteConfirmKeyboard(card.id), {
        messageThreadId: thread,
      });
    }
    return true;
  }

  await removeMediaCard(card.id);
  await clearDraft(opts.chatId, opts.telegramUserId);
  await answerTelegramCallback(callbackId, "Dipadam");
  const text = "Album telah dipadam dari CoE Media. Pautan Google Photos masih ada.";
  if (messageId) {
    await editTelegramMessage(opts.chatId, messageId, text, { inline_keyboard: [] });
  } else {
    await reply(opts.chatId, text, undefined, { messageThreadId: thread });
  }
  return true;
}

async function handleAuthorizedMessage(opts: {
  message: TelegramResourceMessage;
  chatId: string;
  chatType: string;
  telegramUserId: string;
  staff: StaffRow;
}): Promise<boolean> {
  const command = parseBotCommand(
    opts.message.text ?? opts.message.caption,
    getTelegramBotUsername(),
  );
  const file = extractFile(opts.message, command === "surat");
  const fotoUrl = extractFotoUrl(
    opts.message,
    command !== null && MEDIA_FOTO_COMMANDS.has(command),
  );
  const isGroup = isGroupChat(opts.chatType);
  const thread = threadIdOf(opts.message);

  if (command === "batal") {
    const draft = await findDraft(opts.chatId, opts.telegramUserId);
    await clearDraft(opts.chatId, opts.telegramUserId);
    await deleteTelegramMessages(opts.chatId, [draft?.promptMessageId, opts.message.message_id]);
    return true;
  }

  if (command && RESOURCE_MANAGE_COMMANDS.has(command)) {
    await handleManageCommand({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      userId: opts.staff.id,
      command,
      remainder: parseBotCommandRemainder(opts.message.text ?? opts.message.caption),
      replyToMessageId: opts.message.message_id,
      messageThreadId: thread,
    });
    return true;
  }

  if (command === "surat") {
    if (file) {
      await startFromFile({
        chatId: opts.chatId,
        telegramUserId: opts.telegramUserId,
        userId: opts.staff.id,
        file,
        replyToMessageId: opts.message.message_id,
        messageThreadId: thread,
      });
      return true;
    }
    const promptMessageId = await reply(
      opts.chatId,
      askFilePrompt(isGroup),
      cancelKeyboard(),
      { replyToMessageId: opts.message.message_id, messageThreadId: thread },
    );
    await upsertDraft({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      userId: opts.staff.id,
      fileId: null,
      fileName: null,
      mimeType: null,
      fileSize: null,
      step: "await_file",
      kategori: null,
      letterMonth: null,
      promptMessageId: promptMessageId ?? null,
    });
    return true;
  }

  if (command && MEDIA_FOTO_COMMANDS.has(command)) {
    if (fotoUrl) {
      await startFromFotoUrl({
        chatId: opts.chatId,
        telegramUserId: opts.telegramUserId,
        userId: opts.staff.id,
        url: fotoUrl,
        replyToMessageId: opts.message.message_id,
        messageThreadId: thread,
      });
      return true;
    }
    const promptMessageId = await reply(
      opts.chatId,
      askFotoUrlPrompt(isGroup),
      cancelKeyboard(),
      { replyToMessageId: opts.message.message_id, messageThreadId: thread },
    );
    await upsertDraft({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      userId: opts.staff.id,
      fileId: null,
      fileName: null,
      mimeType: null,
      fileSize: null,
      step: "foto_await_url",
      kategori: MEDIA_FOTO_KATEGORI,
      letterMonth: null,
      promptMessageId: promptMessageId ?? null,
    });
    return true;
  }

  if (file) {
    const draft = await findDraft(opts.chatId, opts.telegramUserId);
    if (draft && isFotoDraftStep(draft.step)) {
      await reply(opts.chatId, askFotoUrlPrompt(isGroup), cancelKeyboard(), {
        messageThreadId: thread,
      });
      return true;
    }
    if (draft || !isGroup) {
      await startFromFile({
        chatId: opts.chatId,
        telegramUserId: opts.telegramUserId,
        userId: opts.staff.id,
        file,
        replyToMessageId: opts.message.message_id,
        messageThreadId: thread,
      });
      return true;
    }
    return false;
  }

  if (fotoUrl) {
    const draft = await findDraft(opts.chatId, opts.telegramUserId);
    if (!draft || draft.step === "foto_await_url") {
      await startFromFotoUrl({
        chatId: opts.chatId,
        telegramUserId: opts.telegramUserId,
        userId: opts.staff.id,
        url: fotoUrl,
        replyToMessageId: opts.message.message_id,
        messageThreadId: thread,
      });
      return true;
    }
  }

  const text = opts.message.text?.trim() ?? "";
  if (!text || command) return false;

  const draft = await findDraft(opts.chatId, opts.telegramUserId);
  if (!draft) return false;
  if (draft.step === "ubah_tajuk") {
    await saveEditedTitle({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      draft,
      title: text,
      titleMessageId: opts.message.message_id,
      messageThreadId: thread,
    });
    return true;
  }
  if (draft.step === "foto_ubah_tajuk") {
    await saveEditedMediaTitle({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      draft,
      title: text,
      titleMessageId: opts.message.message_id,
      messageThreadId: thread,
    });
    return true;
  }
  if (draft.step === "nama") {
    await publishDraft({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      draft,
      title: text,
      titleMessageId: opts.message.message_id,
      messageThreadId: thread,
    });
    return true;
  }
  if (draft.step === "foto_nama") {
    await publishFotoDraft({
      chatId: opts.chatId,
      telegramUserId: opts.telegramUserId,
      draft,
      title: text,
      titleMessageId: opts.message.message_id,
      messageThreadId: thread,
    });
    return true;
  }
  if (draft.step === "await_file") {
    await reply(opts.chatId, askFilePrompt(isGroup), cancelKeyboard(), { messageThreadId: thread });
    return true;
  }
  if (draft.step === "foto_await_url") {
    await reply(opts.chatId, askFotoUrlPrompt(isGroup), cancelKeyboard(), {
      messageThreadId: thread,
    });
    return true;
  }
  await reply(opts.chatId, "Sila guna butang di atas, atau taip /batal.", cancelKeyboard(), {
    messageThreadId: thread,
  });
  return true;
}

async function executeResourceSearch(
  intent: { kategori: string | null; query: string },
  page: number,
): Promise<{
  text: string;
  keyboard: ReturnType<typeof resourceSearchPageKeyboard>;
  page: number;
  totalPages: number;
}> {
  const hits = await loadSearchHits(intent);
  const totalPages = Math.max(1, Math.ceil(hits.length / RESOURCE_SEARCH_LIMIT) || 1);
  const safePage = Math.min(Math.max(1, page), hits.length === 0 ? 1 : totalPages);
  return {
    text: formatResourceSearchReply(intent.query, hits, {
      page: safePage,
      kategori: intent.kategori,
    }),
    keyboard: resourceSearchPageKeyboard(safePage, totalPages, intent.kategori, intent.query),
    page: safePage,
    totalPages,
  };
}

async function handleSearchCommand(
  message: TelegramResourceMessage,
  chatId: string,
  command: string,
): Promise<void> {
  const intent = parseResourceSearchIntent(
    command,
    parseBotCommandRemainder(message.text ?? message.caption),
  );
  if (intent.help) {
    await reply(chatId, formatResourceSearchReply("", [], { help: true }), undefined, {
      replyToMessageId: message.message_id,
      messageThreadId: threadIdOf(message),
    });
    return;
  }

  const result = await executeResourceSearch(intent, 1);
  await reply(chatId, result.text, result.keyboard.length > 0 ? result.keyboard : undefined, {
    replyToMessageId: message.message_id,
    messageThreadId: threadIdOf(message),
  });
}

async function handleSearchPageCallback(query: TelegramResourceCallback): Promise<boolean> {
  const callbackId = query.id;
  const chatId = query.message?.chat?.id;
  const parsed = parseResourceSearchCallback(query.data);
  if (!callbackId || !chatId || !parsed) return false;

  const result = await executeResourceSearch(
    { kategori: parsed.kategori, query: parsed.query },
    parsed.page,
  );
  if (query.message?.message_id) {
    await editTelegramMessage(String(chatId), query.message.message_id, result.text, {
      inline_keyboard: result.keyboard,
    });
  }
  await answerTelegramCallback(
    callbackId,
    result.totalPages > 1 ? `Muka ${result.page}/${result.totalPages}` : undefined,
  );
  return true;
}

async function handleMessage(message: TelegramResourceMessage): Promise<boolean> {
  const chatId = message.chat?.id;
  const fromId = message.from?.id;
  const chatType = message.chat?.type;
  if (!chatId || !fromId || !chatType) return false;
  if (chatType !== "private" && !isGroupChat(chatType)) return false;

  const command = parseBotCommand(message.text ?? message.caption, getTelegramBotUsername());
  if (command && RESOURCE_SEARCH_COMMANDS.has(command)) {
    await handleSearchCommand(message, String(chatId), command);
    return true;
  }
  if (command && RESOURCE_HELP_COMMANDS.has(command)) {
    await reply(String(chatId), nexaBotHelpText(), undefined, {
      replyToMessageId: message.message_id,
      messageThreadId: threadIdOf(message),
    });
    return true;
  }

  const telegramUserId = String(fromId);
  const staff = await findStaffByTelegramUserId(telegramUserId);
  if (!staff) {
    const command = parseBotCommand(message.text ?? message.caption, getTelegramBotUsername());
    const file = extractFile(message, command === "surat");
    const fotoUrl = extractFotoUrl(
      message,
      command !== null && MEDIA_FOTO_COMMANDS.has(command),
    );
    if (
      command === "surat" ||
      (command && MEDIA_FOTO_COMMANDS.has(command)) ||
      (command && RESOURCE_MANAGE_COMMANDS.has(command)) ||
      (chatType === "private" && file) ||
      (chatType === "private" && fotoUrl)
    ) {
      await reply(
        String(chatId),
        "Akaun Telegram ini belum disambungkan sebagai pentadbir. Ikat akaun peribadi anda di /admin/telegram dahulu, kemudian cuba semula.",
        undefined,
        { messageThreadId: threadIdOf(message) },
      );
      return true;
    }
    return false;
  }

  return handleAuthorizedMessage({
    message,
    chatId: String(chatId),
    chatType,
    telegramUserId,
    staff,
  });
}

async function handleCallback(query: TelegramResourceCallback): Promise<boolean> {
  const callbackId = query.id;
  const chatId = query.message?.chat?.id;
  const fromId = query.from?.id;
  if (!callbackId || !chatId || !fromId) return false;

  if (parseResourceSearchCallback(query.data)) {
    return handleSearchPageCallback(query);
  }

  const mediaParsed = parseMediaFotoCallback(query.data);
  if (mediaParsed) {
    const telegramUserId = String(fromId);
    const staff = await findStaffByTelegramUserId(telegramUserId);
    if (!staff) {
      await answerTelegramCallback(callbackId, "Tiada kebenaran.");
      return true;
    }
    if (mediaParsed.type === "guna_tajuk") {
      const draft = await findDraft(String(chatId), telegramUserId);
      const title = draft ? suggestedFotoTitle(draft) : null;
      if (!draft || draft.step !== "foto_nama" || !title) {
        await answerTelegramCallback(callbackId, "Sila taip nama aktiviti.");
        return true;
      }
      await answerTelegramCallback(callbackId);
      await publishFotoDraft({
        chatId: String(chatId),
        telegramUserId,
        draft,
        title,
        messageThreadId: threadIdOf(query.message),
      });
      return true;
    }
    return handleMediaManageCallback({
      query,
      chatId: String(chatId),
      telegramUserId,
      staff,
      parsed: mediaParsed,
    });
  }

  const parsed = parseResourceCallback(query.data);
  if (!parsed) {
    await answerTelegramCallback(callbackId);
    return false;
  }

  const telegramUserId = String(fromId);
  const staff = await findStaffByTelegramUserId(telegramUserId);
  if (!staff) {
    await answerTelegramCallback(callbackId, "Tiada kebenaran.");
    return true;
  }

  if (
    parsed.type === "ubah_tajuk" ||
    parsed.type === "ubah_bulan" ||
    parsed.type === "padam" ||
    parsed.type === "padam_ya"
  ) {
    return handleManageCallback({
      query,
      chatId: String(chatId),
      telegramUserId,
      staff,
      parsed,
    });
  }

  const draft = await findDraft(String(chatId), telegramUserId);
  if (parsed.type === "batal") {
    await answerTelegramCallback(callbackId, "Dibatalkan");
    await deleteTelegramMessages(String(chatId), [
      query.message?.message_id,
      draft?.promptMessageId,
    ]);
    await clearDraft(String(chatId), telegramUserId);
    return true;
  }

  if (!draft) {
    await answerTelegramCallback(callbackId, "Draf telah tamat. Hantar /surat atau /foto semula.");
    return true;
  }

  if (parsed.type === "kategori") {
    if (isFotoDraftStep(draft.step)) {
      await answerTelegramCallback(callbackId, "Pilihan tidak sah.");
      return true;
    }
    const slug: ResourcesBotKategoriSlug = parsed.slug;
    await upsertDraft({
      chatId: draft.chatId,
      telegramUserId: draft.telegramUserId,
      userId: draft.userId,
      fileId: draft.fileId,
      fileName: draft.fileName,
      mimeType: draft.mimeType,
      fileSize: draft.fileSize,
      step: "bulan",
      kategori: slug,
      letterMonth: null,
      promptMessageId: query.message?.message_id ?? draft.promptMessageId ?? null,
    });
    await answerTelegramCallback(callbackId);
    if (query.message?.message_id) {
      await editTelegramMessage(String(chatId), query.message.message_id, monthPrompt(slug), {
        inline_keyboard: monthKeyboard(),
      });
    } else {
      await reply(String(chatId), monthPrompt(slug), monthKeyboard(), {
        messageThreadId: threadIdOf(query.message),
      });
    }
    return true;
  }

  if (parsed.type === "tahun") {
    const fotoWizard = isFotoDraftStep(draft.step);
    const editing = fotoWizard
      ? draft.step === "foto_ubah_bulan" && Boolean(draftMediaCardIdFromFileId(draft.fileId))
      : draft.step === "ubah_bulan" && Boolean(draftCardIdFromFileId(draft.fileId));
    if (
      !isLetterMonthKey(parsed.center) ||
      (fotoWizard
        ? draft.kategori !== MEDIA_FOTO_KATEGORI
        : !draft.kategori ||
          (!editing && !isResourcesBotKategori(draft.kategori)) ||
          (editing && !resourcesKategoriBySlug(draft.kategori)))
    ) {
      await answerTelegramCallback(callbackId, "Pilihan tidak sah.");
      return true;
    }
    await upsertDraft({
      chatId: draft.chatId,
      telegramUserId: draft.telegramUserId,
      userId: draft.userId,
      fileId: draft.fileId,
      fileName: draft.fileName,
      mimeType: draft.mimeType,
      fileSize: draft.fileSize,
      step: fotoWizard ? (editing ? "foto_ubah_bulan" : "foto_bulan") : editing ? "ubah_bulan" : "bulan",
      kategori: draft.kategori,
      letterMonth: null,
      promptMessageId: query.message?.message_id ?? draft.promptMessageId ?? null,
    });
    await answerTelegramCallback(callbackId);
    const yearPrompt = fotoWizard
      ? fotoMonthPrompt(suggestedFotoTitle(draft))
      : monthPrompt(draft.kategori ?? "");
    if (query.message?.message_id) {
      await editTelegramMessage(String(chatId), query.message.message_id, yearPrompt, {
        inline_keyboard: monthKeyboard(parsed.center),
      });
    } else {
      await reply(String(chatId), yearPrompt, monthKeyboard(parsed.center), {
        messageThreadId: threadIdOf(query.message),
      });
    }
    return true;
  }

  if (parsed.type !== "bulan") return true;

  const fotoEditCardId =
    draft.step === "foto_ubah_bulan" ? draftMediaCardIdFromFileId(draft.fileId) : null;
  if (fotoEditCardId) {
    if (!isLetterMonthKey(parsed.month)) {
      await answerTelegramCallback(callbackId, "Pilihan tidak sah.");
      return true;
    }
    const updated = await updateMediaCardMeta(fotoEditCardId, { letterMonth: parsed.month });
    const card = await getMediaCard(fotoEditCardId);
    await clearDraft(String(chatId), telegramUserId);
    if (!updated.ok || !card) {
      await answerTelegramCallback(callbackId, "Album tidak wujud.");
      return true;
    }
    await answerTelegramCallback(callbackId, "Bulan dikemas kini");
    await showMediaCardSaved({
      chatId: String(chatId),
      messageId: query.message?.message_id,
      prefix: "Bulan album telah dikemas kini.",
      card,
      messageThreadId: threadIdOf(query.message),
    });
    return true;
  }

  if (draft.step === "foto_bulan") {
    if (
      !draft.fileName ||
      !extractGooglePhotosUrl(draft.fileName) ||
      !isLetterMonthKey(parsed.month)
    ) {
      await answerTelegramCallback(callbackId, "Pilihan tidak sah.");
      return true;
    }
    await upsertDraft({
      chatId: draft.chatId,
      telegramUserId: draft.telegramUserId,
      userId: draft.userId,
      fileId: draft.fileId,
      fileName: draft.fileName,
      mimeType: draft.mimeType,
      fileSize: draft.fileSize,
      step: "foto_nama",
      kategori: MEDIA_FOTO_KATEGORI,
      letterMonth: parsed.month,
      promptMessageId: query.message?.message_id ?? draft.promptMessageId ?? null,
    });
    await answerTelegramCallback(callbackId);
    const albumTitle = suggestedFotoTitle(draft);
    if (query.message?.message_id) {
      await editTelegramMessage(
        String(chatId),
        query.message.message_id,
        fotoTitlePrompt(parsed.month, albumTitle),
        { inline_keyboard: fotoTitleKeyboard(albumTitle) },
      );
    } else {
      await reply(String(chatId), fotoTitlePrompt(parsed.month, albumTitle), fotoTitleKeyboard(albumTitle), {
        messageThreadId: threadIdOf(query.message),
      });
    }
    return true;
  }

  const editCardId = draft.step === "ubah_bulan" ? draftCardIdFromFileId(draft.fileId) : null;
  if (editCardId) {
    if (!isLetterMonthKey(parsed.month)) {
      await answerTelegramCallback(callbackId, "Pilihan tidak sah.");
      return true;
    }
    const updated = await updateResourcesCardMeta(editCardId, { letterMonth: parsed.month });
    const card = await getResourcesCard(editCardId);
    await clearDraft(String(chatId), telegramUserId);
    if (!updated.ok || !card) {
      await answerTelegramCallback(callbackId, "Surat tidak wujud.");
      return true;
    }
    await answerTelegramCallback(callbackId, "Bulan dikemas kini");
    await showCardSaved({
      chatId: String(chatId),
      messageId: query.message?.message_id,
      prefix: "Bulan surat telah dikemas kini.",
      card,
      messageThreadId: threadIdOf(query.message),
    });
    return true;
  }

  if (!draft.kategori || !isResourcesBotKategori(draft.kategori) || !isLetterMonthKey(parsed.month)) {
    await answerTelegramCallback(callbackId, "Pilihan tidak sah.");
    return true;
  }

  await upsertDraft({
    chatId: draft.chatId,
    telegramUserId: draft.telegramUserId,
    userId: draft.userId,
    fileId: draft.fileId,
    fileName: draft.fileName,
    mimeType: draft.mimeType,
    fileSize: draft.fileSize,
    step: "nama",
    kategori: draft.kategori,
    letterMonth: parsed.month,
    promptMessageId: query.message?.message_id ?? draft.promptMessageId ?? null,
  });
  await answerTelegramCallback(callbackId);
  if (query.message?.message_id) {
    await editTelegramMessage(
      String(chatId),
      query.message.message_id,
      titlePrompt(draft.kategori, parsed.month),
      { inline_keyboard: cancelKeyboard() },
    );
  } else {
    await reply(String(chatId), titlePrompt(draft.kategori, parsed.month), cancelKeyboard(), {
      messageThreadId: threadIdOf(query.message),
    });
  }
  return true;
}

export async function handleTelegramResourceUpdate(
  update: TelegramResourceUpdate,
): Promise<boolean> {
  await clearExpiredDrafts();
  if (update.callback_query) return handleCallback(update.callback_query);
  if (update.message) return handleMessage(update.message);
  return false;
}
