import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/$/, "");

if (!token || !secret || !baseUrl || !baseUrl.startsWith("https://")) {
  throw new Error(
    "Tetapkan TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET dan APP_BASE_URL HTTPS dahulu.",
  );
}
if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  throw new Error("TELEGRAM_WEBHOOK_SECRET hanya boleh mengandungi A-Z, a-z, 0-9, _ dan -.");
}

let response: Response;
try {
  response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: `${baseUrl}/api/telegram/webhook`,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
  });
} catch {
  throw new Error("Tidak dapat menghubungi Telegram untuk menetapkan webhook.");
}
const result = (await response.json()) as { ok?: boolean; description?: string };
if (!response.ok || !result.ok) {
  throw new Error(result.description ?? "Telegram setWebhook gagal.");
}

console.log("Webhook Telegram berjaya ditetapkan.");
