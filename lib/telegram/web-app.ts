/* ---------- Membuka portal daripada mesej NexaBot: log masuk Mini App (2026-11-09) ----------
   Pautan biasa dalam mesej dibuka dalam pelayar Telegram, yang tidak log masuk ke portal: halaman
   /admin meminta ID dan kata laluan setiap kali. Jadi, dalam sembang peribadi, butang mesej membuka
   portal sebagai Mini App di /tg?ke=<halaman>: Telegram menambah siapa yang membukanya (initData),
   ditandatangani dengan kunci daripada token bot; portal menyemaknya, mencari staf yang Telegramnya
   disambungkan untuk log masuk (jadual telegram_logins), log masukkan dan terus ke halaman itu.
   Mesej yang dihantar semula kepada orang lain dibuka sebagai orang itu (yang tidak disambungkan
   kepada staf tersebut). Fail ini tulen (tiada db) supaya boleh diuji. */
import { createHmac, timingSafeEqual } from "crypto";

/** Butang mesej: `url` sentiasa ada (sandaran); `webAppUrl` = buka sebagai Mini App jika boleh. */
export type TelegramButton = {
  text: string;
  url: string;
  webAppUrl?: string;
};

/** Berapa lama initData masih diterima selepas Telegram membuatnya (dibuat setiap kali Mini App dibuka). */
export const TG_APP_MS = 60 * 60_000;

export type TelegramAppUser =
  | { ok: true; tgId: string }
  | { ok: false; error: "bad" | "old" };

/**
 * Akaun Telegram yang membuka Mini App, jika Telegram menandatangani data yang dihantar
 * ("Validating data received via the Mini App": kunci = HMAC-SHA256("WebAppData", token bot),
 * kemudian HMAC-SHA256 setiap medan kecuali hash, disusun, satu "kunci=nilai" setiap baris —
 * diterima sama ada medan baharu "signature" dikira atau tidak) dan umurnya kurang sejam.
 */
export function verifyTelegramInitData(
  initData: unknown,
  token: string | undefined,
  now = Date.now(),
): TelegramAppUser {
  const botToken = token?.trim();
  if (!botToken || typeof initData !== "string" || !initData || initData.length > 8192) {
    return { ok: false, error: "bad" };
  }
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";
  if (!/^[0-9a-f]{64}$/.test(hash)) return { ok: false, error: "bad" };

  const key = createHmac("sha256", "WebAppData").update(botToken).digest();
  const fields = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const sign = (skip: string[]) =>
    createHmac("sha256", key)
      .update(
        fields
          .filter(([k]) => !skip.includes(k))
          .map(([k, v]) => `${k}=${v}`)
          .join("\n"),
      )
      .digest();
  const want = Buffer.from(hash, "hex");
  if (![["hash"], ["hash", "signature"]].some((skip) => timingSafeEqual(sign(skip), want))) {
    return { ok: false, error: "bad" };
  }

  const at = Number(params.get("auth_date")) * 1000;
  if (!Number.isFinite(at) || at <= 0 || now - at > TG_APP_MS || at - now > 5 * 60_000) {
    return { ok: false, error: "old" };
  }

  let id: unknown;
  try {
    id = (JSON.parse(params.get("user") ?? "") as { id?: unknown } | null)?.id;
  } catch {
    return { ok: false, error: "bad" };
  }
  return Number.isSafeInteger(id) && (id as number) > 0
    ? { ok: true, tgId: String(id) }
    : { ok: false, error: "bad" };
}

/** Sembang peribadi dengan bot: id positif (kumpulan dan saluran bernombor negatif). */
export function isPrivateChatId(chatId: string): boolean {
  return /^[1-9][0-9]{0,19}$/.test(chatId);
}

/**
 * Alamat Mini App bagi pautan portal `url`: `${origin}/tg?ke=<laluan>`. Hanya https
 * (Telegram menolak Mini App http, cth. localhost) — selain itu null.
 */
export function miniAppUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const path = `${parsed.pathname}${parsed.search}`;
  return `${parsed.origin}/tg?ke=${encodeURIComponent(path)}`;
}

/**
 * Butang yang membuka halaman portal `url`: dalam sembang peribadi, sebagai Mini App
 * (log masuk melalui Telegram); dalam kumpulan, pautan biasa (Telegram hanya membenarkan
 * butang Mini App dalam sembang peribadi).
 */
export function telegramOpenButton(chatId: string, text: string, url: string): TelegramButton {
  const webAppUrl = isPrivateChatId(chatId) ? miniAppUrl(url) : null;
  return webAppUrl ? { text, url, webAppUrl } : { text, url };
}
