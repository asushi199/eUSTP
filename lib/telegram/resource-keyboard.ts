import {
  RESOURCES_BOT_KATEGORI_SLUGS,
  resourcesKategoriBySlug,
} from "@/lib/resources/kategori";
import { formatResourceMonthLabel, listLetterMonthChoices } from "@/lib/resources/search";
import {
  RESOURCE_CANCEL_CALLBACK,
  resourceKategoriCallbackData,
  resourceMonthCallbackData,
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

export function monthKeyboard(now = new Date()): TelegramInlineKeyboard {
  const choices = listLetterMonthChoices(now);
  const rows: TelegramInlineKeyboard = [];
  for (let i = 0; i < choices.length; i += 3) {
    rows.push(
      choices.slice(i, i + 3).map((choice) => ({
        text: choice.label,
        callback_data: resourceMonthCallbackData(choice.value),
      })),
    );
  }
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
    "Pilih bulan surat (boleh berbeza daripada bulan muat naik):",
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
