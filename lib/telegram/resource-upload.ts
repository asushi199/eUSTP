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
import { publishResourcesFile } from "@/lib/resources/publish";
import { listResourcesCardsGrouped } from "@/lib/resources/queries";
import {
  filterResourceCards,
  formatResourceMonthLabel,
  toResourcesExplorerGroups,
} from "@/lib/resources/search";
import { canManageKandungan } from "@/lib/roles";
import { parseBotCommand, parseBotCommandRemainder, parseResourceCallback, RESOURCE_SEARCH_COMMANDS } from "./commands";
import { formatResourceSearchReply } from "./resource-search-format";
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
  cancelKeyboard,
  kategoriKeyboard,
  kategoriPrompt,
  monthKeyboard,
  monthPrompt,
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
  keyboard?: ReturnType<typeof kategoriKeyboard>,
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
    const kategori = resourcesKategoriBySlug(opts.draft.kategori);
    const portal = portalBaseUrl();
    const publicUrl = portal ? `${portal}${resourcesHref(opts.draft.kategori)}` : null;
    const successText = [
      "Surat telah disimpan.",
      "",
      `Tajuk: ${title}`,
      `Kumpulan: ${kategori?.title ?? opts.draft.kategori}`,
      `Bulan: ${formatResourceMonthLabel(opts.draft.letterMonth)}`,
    ].join("\n");
    const successMarkup = {
      inline_keyboard: [
        [{ text: "Buka di Drive", url: published.url }],
        ...(publicUrl ? [[{ text: "Lihat di portal", url: publicUrl }]] : []),
      ],
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
  const isGroup = isGroupChat(opts.chatType);
  const thread = threadIdOf(opts.message);

  if (command === "batal") {
    const draft = await findDraft(opts.chatId, opts.telegramUserId);
    await clearDraft(opts.chatId, opts.telegramUserId);
    await deleteTelegramMessages(opts.chatId, [draft?.promptMessageId, opts.message.message_id]);
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

  if (command === "start") {
    if (isGroup) return false;
    await reply(
      opts.chatId,
      "NexaBot sedia. Hantar fail surat atau taip /surat untuk muat naik. Taip /cari diikuti kata kunci untuk mencari surat. Taip /batal untuk batal.",
      undefined,
      { messageThreadId: thread },
    );
    return true;
  }

  if (file) {
    const draft = await findDraft(opts.chatId, opts.telegramUserId);
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

  const text = opts.message.text?.trim() ?? "";
  if (!text || command) return false;

  const draft = await findDraft(opts.chatId, opts.telegramUserId);
  if (!draft) return false;
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
  if (draft.step === "await_file") {
    await reply(opts.chatId, askFilePrompt(isGroup), cancelKeyboard(), { messageThreadId: thread });
    return true;
  }
  await reply(opts.chatId, "Sila guna butang di atas, atau taip /batal.", cancelKeyboard(), {
    messageThreadId: thread,
  });
  return true;
}

async function handleSearchCommand(
  message: TelegramResourceMessage,
  chatId: string,
): Promise<void> {
  const query = parseBotCommandRemainder(message.text ?? message.caption);
  if (!query) {
    await reply(chatId, formatResourceSearchReply("", []), undefined, {
      replyToMessageId: message.message_id,
      messageThreadId: threadIdOf(message),
    });
    return;
  }

  const groups = toResourcesExplorerGroups(await listResourcesCardsGrouped());
  const hits = filterResourceCards(
    groups.flatMap((group) => group.cards),
    { query },
  );
  await reply(chatId, formatResourceSearchReply(query, hits), undefined, {
    replyToMessageId: message.message_id,
    messageThreadId: threadIdOf(message),
  });
}

async function handleMessage(message: TelegramResourceMessage): Promise<boolean> {
  const chatId = message.chat?.id;
  const fromId = message.from?.id;
  const chatType = message.chat?.type;
  if (!chatId || !fromId || !chatType) return false;
  if (chatType !== "private" && !isGroupChat(chatType)) return false;

  const command = parseBotCommand(message.text ?? message.caption, getTelegramBotUsername());
  if (command && RESOURCE_SEARCH_COMMANDS.has(command)) {
    await handleSearchCommand(message, String(chatId));
    return true;
  }

  const telegramUserId = String(fromId);
  const staff = await findStaffByTelegramUserId(telegramUserId);
  if (!staff) {
    const command = parseBotCommand(message.text ?? message.caption, getTelegramBotUsername());
    const file = extractFile(message, command === "surat");
    if (command === "surat" || (chatType === "private" && file)) {
      await reply(
        String(chatId),
        "Akaun Telegram ini belum disambungkan sebagai pentadbir CoE Resources. Ikat akaun peribadi anda di /admin/telegram dahulu, kemudian cuba /surat semula.",
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
    await answerTelegramCallback(callbackId, "Draf telah tamat. Hantar /surat semula.");
    return true;
  }

  if (parsed.type === "kategori") {
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
    if (!draft.kategori || !isResourcesBotKategori(draft.kategori) || !isLetterMonthKey(parsed.center)) {
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
      step: "bulan",
      kategori: draft.kategori,
      letterMonth: null,
      promptMessageId: query.message?.message_id ?? draft.promptMessageId ?? null,
    });
    await answerTelegramCallback(callbackId);
    if (query.message?.message_id) {
      await editTelegramMessage(String(chatId), query.message.message_id, monthPrompt(draft.kategori), {
        inline_keyboard: monthKeyboard(parsed.center),
      });
    } else {
      await reply(String(chatId), monthPrompt(draft.kategori), monthKeyboard(parsed.center), {
        messageThreadId: threadIdOf(query.message),
      });
    }
    return true;
  }

  if (parsed.type !== "bulan") return true;

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
