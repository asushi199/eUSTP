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
  resourceKategoriCallbackData,
  resourceMonthCallbackData,
  resourceYearCallbackData,
} from "./commands";

export type TelegramInlineButton = {
  text: string;
  callback_data: string;
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
    return "Sila hantar fail PDF atau imej surat sebagai balasan mesej ini. Kemudian pilih kumpulan, bulan dan nama.";
  }
  return "Sila hantar fail PDF atau imej surat. Kemudian pilih kumpulan, bulan dan nama.";
}
