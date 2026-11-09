/* Log masuk Mini App NexaBot (lib/telegram/web-app.ts, lib/auth-paths.ts): tandatangan initData
   Telegram, butang ikut jenis sembang, dan ke mana kembali selepas log masuk. */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { needsStaffAuth, safePath } from "../../lib/auth-paths";
import { isPlainStartCommand, parseTelegramStartBindToken } from "../../lib/telegram/binding";
import { mediaSavedKeyboard, resourceSavedKeyboard } from "../../lib/telegram/resource-keyboard";
import {
  inlineOpenButton,
  isPrivateChatId,
  miniAppUrl,
  telegramOpenButton,
  verifyTelegramInitData,
} from "../../lib/telegram/web-app";

const TOKEN = "123456:TEST-token-for-tests";
const NOW = Date.UTC(2026, 10, 9, 13, 0, 0);
const user = (id: number) => JSON.stringify({ id, first_name: "Aminah", language_code: "ms" });

/** initData seperti Telegram membuatnya: ditandatangani atas semua medan kecuali hash
 *  (atau, `noSig`, juga tanpa "signature"). */
function initData(fields: Record<string, string>, o: { token?: string; noSig?: boolean } = {}) {
  const key = createHmac("sha256", "WebAppData").update(o.token ?? TOKEN).digest();
  const lines = Object.entries(fields)
    .filter(([k]) => !(o.noSig && k === "signature"))
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`);
  const hash = createHmac("sha256", key).update(lines.join("\n")).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}
const base = (o: Partial<Record<string, string>> = {}) =>
  ({
    auth_date: String(NOW / 1000 - 60),
    query_id: "AAF9",
    user: user(2006),
    signature: "c2lnbmF0dXJl",
    ...o,
  }) as Record<string, string>;

test("initData Mini App: tandatangan Telegram dengan token bot, kurang sejam, id akaun", () => {
  assert.deepEqual(verifyTelegramInitData(initData(base()), TOKEN, NOW), { ok: true, tgId: "2006" });
  /* ditandatangani seperti sesetengah aplikasi masih buat, tanpa medan "signature" */
  assert.deepEqual(verifyTelegramInitData(initData(base(), { noSig: true }), TOKEN, NOW), {
    ok: true,
    tgId: "2006",
  });
  /* id orang lain dimasukkan selepas Telegram menandatangani */
  const forged = new URLSearchParams(initData(base()));
  forged.set("user", user(2001));
  assert.deepEqual(verifyTelegramInitData(forged.toString(), TOKEN, NOW), { ok: false, error: "bad" });
  /* ditandatangani oleh bot lain */
  assert.deepEqual(verifyTelegramInitData(initData(base(), { token: "999:other" }), TOKEN, NOW), {
    ok: false,
    error: "bad",
  });
  /* terlalu lama, atau dari masa depan */
  assert.deepEqual(
    verifyTelegramInitData(initData(base({ auth_date: String(NOW / 1000 - 2 * 3600) })), TOKEN, NOW),
    { ok: false, error: "old" },
  );
  assert.deepEqual(
    verifyTelegramInitData(initData(base({ auth_date: String(NOW / 1000 + 3600) })), TOKEN, NOW),
    { ok: false, error: "old" },
  );
  /* ditandatangani, tetapi tiada akaun */
  assert.deepEqual(verifyTelegramInitData(initData(base({ user: "{}" })), TOKEN, NOW), {
    ok: false,
    error: "bad",
  });
  assert.deepEqual(verifyTelegramInitData(initData(base({ user: "bukan json" })), TOKEN, NOW), {
    ok: false,
    error: "bad",
  });
  for (const x of ["", "hash=zz", "user=1", 42, null, undefined]) {
    assert.deepEqual(verifyTelegramInitData(x, TOKEN, NOW), { ok: false, error: "bad" });
  }
  /* bot belum dikonfigurasi: tiada sesiapa */
  assert.deepEqual(verifyTelegramInitData(initData(base()), undefined, NOW), { ok: false, error: "bad" });
  assert.deepEqual(verifyTelegramInitData(initData(base()), "  ", NOW), { ok: false, error: "bad" });
});

test("butang mesej: Mini App dalam sembang peribadi (https), pautan biasa dalam kumpulan", () => {
  const url = "https://nexa-ustpmanjung.vercel.app/admin/peralatan/sitiawan/permohonan/12";
  assert.equal(
    miniAppUrl(url),
    "https://nexa-ustpmanjung.vercel.app/tg?ke=%2Fadmin%2Fperalatan%2Fsitiawan%2Fpermohonan%2F12",
  );
  assert.deepEqual(telegramOpenButton("2006", "Semak permohonan", url), {
    text: "Semak permohonan",
    url,
    webAppUrl: miniAppUrl(url),
  });
  /* kumpulan / supergroup / saluran: Telegram menolak butang Mini App */
  for (const chat of ["-1001234567890", "-42", ""]) {
    assert.equal(isPrivateChatId(chat), false);
    assert.deepEqual(telegramOpenButton(chat, "Semak permohonan", url), { text: "Semak permohonan", url });
  }
  /* http (localhost): Telegram hanya menerima Mini App https */
  assert.equal(miniAppUrl("http://localhost:3000/admin"), null);
  assert.deepEqual(telegramOpenButton("2006", "Buka", "http://localhost:3000/admin"), {
    text: "Buka",
    url: "http://localhost:3000/admin",
  });
  assert.equal(miniAppUrl("bukan url"), null);
  /* pautan kelulusan bertoken: query dikekalkan dalam ?ke= */
  const approve = "https://nexa-ustpmanjung.vercel.app/tempahan/sitiawan/approve/7?token=a%2Bb";
  const ke = new URL(miniAppUrl(approve)!).searchParams.get("ke");
  assert.equal(ke, "/tempahan/sitiawan/approve/7?token=a%2Bb");
  assert.equal(safePath(ke), ke);
});

test("butang portal pada surat / album tersimpan: Mini App dalam sembang peribadi sahaja", () => {
  const portal = "https://nexa-ustpmanjung.vercel.app/resources/surat-ustp";
  const drive = "https://drive.google.com/file/d/abc/view";
  const peribadi = resourceSavedKeyboard({ cardId: 5, driveUrl: drive, portalUrl: portal, chatId: "2006" });
  assert.deepEqual(peribadi[0], [{ text: "Buka di Drive", url: drive }]);
  assert.deepEqual(peribadi[1], [
    { text: "Lihat di portal", web_app: { url: miniAppUrl(portal)! } },
  ]);
  /* kumpulan, atau pemanggil lama tanpa chatId: pautan biasa */
  for (const chatId of ["-1001234567890", undefined]) {
    const k = resourceSavedKeyboard({ cardId: 5, driveUrl: drive, portalUrl: portal, chatId });
    assert.deepEqual(k[1], [{ text: "Lihat di portal", url: portal }]);
  }
  assert.equal(
    resourceSavedKeyboard({ cardId: 5, driveUrl: drive, portalUrl: null, chatId: "2006" })[1].some(
      (b) => b.web_app || b.text === "Lihat di portal",
    ),
    false,
  );
  const media = mediaSavedKeyboard({
    cardId: 9,
    albumUrl: "https://photos.app.goo.gl/x",
    portalUrl: "https://nexa-ustpmanjung.vercel.app/media/koleksi",
    chatId: "2006",
  });
  assert.deepEqual(media[0], [{ text: "Buka album", url: "https://photos.app.goo.gl/x" }]);
  assert.equal(media[1][0].web_app?.url, miniAppUrl("https://nexa-ustpmanjung.vercel.app/media/koleksi"));
  assert.deepEqual(inlineOpenButton("2006", "Buka", "http://localhost:3000/admin"), {
    text: "Buka",
    url: "http://localhost:3000/admin",
  });
});

test("/start sahaja dijawab dengan butang portal; /start bind_… kekal ikatan", () => {
  for (const t of ["/start", "/start ", "/start@NexaManjungBot"]) assert.equal(isPlainStartCommand(t), true, t);
  for (const t of [undefined, "", "/mula", "/start bind_" + "a".repeat(32), "/startx", "/start hello"]) {
    assert.equal(isPlainStartCommand(t), false, String(t));
  }
  assert.equal(parseTelegramStartBindToken("/start bind_" + "a".repeat(32)), "a".repeat(32));
});

test("ke mana selepas log masuk: laluan portal ini sahaja", () => {
  for (const p of ["/", "/admin", "/admin/peralatan/sitiawan/permohonan/12", "/tg?ke=%2Fadmin"]) {
    assert.equal(safePath(p), p);
  }
  for (const p of [
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "evil",
    "/a b",
    "/admin\n",
    `/${"x".repeat(600)}`,
    "",
    undefined,
    null,
    7,
  ]) {
    assert.equal(safePath(p), "/admin");
  }
  assert.equal(safePath("https://evil.example", "/admin/tempahan"), "/admin/tempahan");
});

test("halaman yang perlu log masuk staf (middleware dan /tg)", () => {
  for (const p of ["/admin", "/admin/peralatan/x", "/analisis", "/analisis/optik"]) {
    assert.equal(needsStaffAuth(p), true, p);
  }
  for (const p of ["/", "/tempahan/sitiawan/approve/7", "/analisis/ai-tools", "/analisis/ai-tools/x", "/analisis/delima", "/analisis/ains", "/administrasi"]) {
    assert.equal(needsStaffAuth(p), false, p);
  }
});
