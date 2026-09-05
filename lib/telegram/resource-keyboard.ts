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
  MEDIA_USE_TITLE_CALLBACK,
  RESOURCE_CANCEL_CALLBACK,
  mediaDeleteCallbackData,
  mediaDeleteConfirmCallbackData,
  mediaEditMonthCallbackData,
  mediaEditTitleCallbackData,
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

export function mediaManageKeyboard(cardId: number): TelegramInlineKeyboard {
  return [
    [
      { text: "Ubah tajuk", callback_data: mediaEditTitleCallbackData(cardId) },
      { text: "Ubah bulan", callback_data: mediaEditMonthCallbackData(cardId) },
    ],
    [{ text: "Padam", callback_data: mediaDeleteCallbackData(cardId) }],
  ];
}

export function mediaDeleteConfirmKeyboard(cardId: number): TelegramInlineKeyboard {
  return [
    [{ text: "Ya, padam", callback_data: mediaDeleteConfirmCallbackData(cardId) }],
    [BATAL],
  ];
}

export function mediaSavedKeyboard(opts: {
  cardId: number;
  albumUrl: string;
  portalUrl?: string | null;
}): TelegramInlineKeyboard {
  return [
    [{ text: "Buka album", url: opts.albumUrl }],
    ...(opts.portalUrl ? [[{ text: "Lihat di CoE Media", url: opts.portalUrl }]] : []),
    ...mediaManageKeyboard(opts.cardId),
  ];
}

export function fotoMonthPrompt(albumTitle?: string | null): string {
  return [
    "Pautan Google Photos diterima.",
    albumTitle ? `Tajuk album: ${albumTitle}` : null,
    "",
    "Pilih bulan foto ini (bulan aktiviti, bukan bulan pautan dihantar). Guna « tahun untuk muka surat lain.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function fotoTitlePrompt(letterMonth: string, albumTitle?: string | null): string {
  if (albumTitle) {
    return [
      `Bulan: ${formatResourceMonthLabel(letterMonth)}`,
      `Nama aktiviti: ${albumTitle}`,
      "",
      "Tekan Guna tajuk ini jika betul, atau taip nama baharu.",
    ].join("\n");
  }
  return [
    `Bulan: ${formatResourceMonthLabel(letterMonth)}`,
    "",
    "Tajuk album tidak dapat dibaca. Taip nama aktiviti. Contoh: Program DELIMa SK ABC",
  ].join("\n");
}

export function fotoTitleKeyboard(albumTitle?: string | null): TelegramInlineKeyboard {
  if (!albumTitle) return cancelKeyboard();
  return [[{ text: "Guna tajuk ini", callback_data: MEDIA_USE_TITLE_CALLBACK }], [BATAL]];
}

export function askFotoUrlPrompt(isGroup: boolean): string {
  if (isGroup) {
    return [
      "Sila BALAS (Reply) mesej ini dengan pautan Google Photos (photos.google.com atau photos.app.goo.gl).",
      "",
      "Anda juga boleh membalas mesej album sedia ada dengan /foto. Kemudian pilih bulan dan nama aktiviti.",
    ].join("\n");
  }
  return "Sila hantar pautan Google Photos (photos.google.com atau photos.app.goo.gl). Kemudian pilih bulan dan nama aktiviti.";
}
