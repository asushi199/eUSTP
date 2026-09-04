import {
  RESOURCES_BOT_KATEGORI_SLUGS,
  resourcesKategoriBySlug,
} from "@/lib/resources/kategori";
import {
  clampLetterMonthCenter,
  currentLetterMonthKey,
  formatResourceMonthLabel,
  listLetterMonthWindow,
  shiftLetterMonth,
} from "@/lib/resources/search";
import {
  RESOURCE_CANCEL_CALLBACK,
  resourceDeleteCallbackData,
  resourceDeleteConfirmCallbackData,
  resourceEditMonthCallbackData,
  resourceEditTitleCallbackData,
  resourceKategoriCallbackData,
  resourceMonthCallbackData,
  resourceYearCallbackData,
} from "./commands";

export type TelegramInlineButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export type TelegramInlineKeyboard = TelegramInlineButton[][];

const BATAL: TelegramInlineButton = { text: "Batal", callback_data: RESOURCE_CANCEL_CALLBACK };

export function kategoriKeyboard(): TelegramInlineKeyboard {
  const row = RESOURCES_BOT_KATEGORI_SLUGS.map((slug) => ({
    text: slug === "surat-ustp" ? "USTP" : "Sekolah / Guru / Murid",
    callback_data: resourceKategoriCallbackData(slug),
  }));
  return [row, [BATAL]];
}

export function monthKeyboard(centerMonth?: string, now = new Date()): TelegramInlineKeyboard {
  const center = clampLetterMonthCenter(centerMonth || currentLetterMonthKey(now), now);
  const choices = listLetterMonthWindow(center);
  const rows: TelegramInlineKeyboard = [];
  for (let i = 0; i < choices.length; i += 3) {
    rows.push(
      choices.slice(i, i + 3).map((choice) => ({
        text: choice.label,
        callback_data: resourceMonthCallbackData(choice.value),
      })),
    );
  }
  const prev = clampLetterMonthCenter(shiftLetterMonth(center, -12), now);
  const next = clampLetterMonthCenter(shiftLetterMonth(center, 12), now);
  const yearRow: TelegramInlineButton[] = [];
  if (prev !== center) {
    yearRow.push({ text: `« ${prev.slice(0, 4)}`, callback_data: resourceYearCallbackData(prev) });
  }
  if (next !== center) {
    yearRow.push({ text: `${next.slice(0, 4)} »`, callback_data: resourceYearCallbackData(next) });
  }
  if (yearRow.length > 0) rows.push(yearRow);
  rows.push([BATAL]);
  return rows;
}

export function cancelKeyboard(): TelegramInlineKeyboard {
  return [[BATAL]];
}

export function resourceManageKeyboard(cardId: number): TelegramInlineKeyboard {
  return [
    [
      { text: "Ubah tajuk", callback_data: resourceEditTitleCallbackData(cardId) },
      { text: "Ubah bulan", callback_data: resourceEditMonthCallbackData(cardId) },
    ],
    [{ text: "Padam", callback_data: resourceDeleteCallbackData(cardId) }],
  ];
}

export function resourceDeleteConfirmKeyboard(cardId: number): TelegramInlineKeyboard {
  return [
    [{ text: "Ya, padam", callback_data: resourceDeleteConfirmCallbackData(cardId) }],
    [BATAL],
  ];
}

export function resourceSavedKeyboard(opts: {
  cardId: number;
  driveUrl: string;
  portalUrl?: string | null;
}): TelegramInlineKeyboard {
  return [
    [{ text: "Buka di Drive", url: opts.driveUrl }],
    ...(opts.portalUrl ? [[{ text: "Lihat di portal", url: opts.portalUrl }]] : []),
    ...resourceManageKeyboard(opts.cardId),
  ];
}

export function resourceManageRow(cardId: number, padamOnly = false): TelegramInlineButton[] {
  if (padamOnly) {
    return [{ text: "Padam", callback_data: resourceDeleteCallbackData(cardId) }];
  }
  return [
    { text: "Tajuk", callback_data: resourceEditTitleCallbackData(cardId) },
    { text: "Bulan", callback_data: resourceEditMonthCallbackData(cardId) },
    { text: "Padam", callback_data: resourceDeleteCallbackData(cardId) },
  ];
}

export function kategoriPrompt(fileName: string): string {
  return [
    `Surat diterima: ${fileName}`,
    "",
    "Pilih kumpulan surat ini:",
  ].join("\n");
}

export function monthPrompt(kategori: string): string {
  const title = resourcesKategoriBySlug(kategori)?.title ?? kategori;
  return [
    `Kumpulan: ${title}`,
    "",
    "Pilih bulan surat (boleh berbeza daripada bulan muat naik). Guna « tahun untuk muka surat lain.",
  ].join("\n");
}

export function titlePrompt(kategori: string, letterMonth: string): string {
  const title = resourcesKategoriBySlug(kategori)?.title ?? kategori;
  return [
    `Kumpulan: ${title}`,
    `Bulan: ${formatResourceMonthLabel(letterMonth)}`,
    "",
    "Taip nama surat ini. Contoh: Surat Jemputan Program DELIMa",
  ].join("\n");
}

export function askFilePrompt(isGroup: boolean): string {
  if (isGroup) {
    return [
      "Sila BALAS (Reply) mesej ini dengan fail PDF atau imej surat.",
      "",
      "Jangan hantar fail sebagai mesej baharu — Telegram tidak akan hantar fail itu kepada NexaBot. Selepas fail diterima, pilih kumpulan, bulan dan nama.",
    ].join("\n");
  }
  return "Sila hantar fail PDF atau imej surat. Kemudian pilih kumpulan, bulan dan nama.";
}
