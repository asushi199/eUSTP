import "server-only";

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import type { UserPeranan } from "@/lib/roles";
import { telegramLogins, users } from "@/lib/schema";
import { verifyTelegramInitData, type TelegramAppUser } from "./web-app";

/** Bentuk pengguna yang sama seperti log masuk ID + kata laluan (lib/auth.ts → jwt). */
export type TelegramLoginUser = {
  id: string;
  name: string;
  username: string;
  nama: string;
  jawatan: string;
  peranan: UserPeranan;
  pkgId: string | null;
  mustChangePassword: boolean;
};

/** Akaun Telegram yang membuka Mini App, disemak dengan token bot (lib/telegram/web-app.ts). */
export function telegramAppUser(initData: unknown, now = Date.now()): TelegramAppUser {
  return verifyTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN, now);
}

/**
 * Staf aktif yang Telegram ini disambungkan untuk log masuk: ada baris telegram_logins DAN
 * `users.telegram_chat_id` masih Telegram yang sama (dalam sembang peribadi, id sembang = id akaun).
 * null jika tiada — termasuk sebelum migrasi 0060 dijalankan (jadual belum wujud).
 */
export async function findTelegramLoginUser(tgId: string): Promise<TelegramLoginUser | null> {
  try {
    const [row] = await db
      .select({
        id: users.id,
        username: users.username,
        nama: users.nama,
        jawatan: users.jawatan,
        peranan: users.peranan,
        pkgId: users.pkgId,
        mustChangePassword: users.mustChangePassword,
      })
      .from(telegramLogins)
      .innerJoin(users, eq(users.id, telegramLogins.userId))
      .where(
        and(
          eq(telegramLogins.telegramUserId, tgId),
          eq(users.telegramChatId, tgId),
          eq(users.aktif, true),
        ),
      )
      .limit(1);
    if (!row) return null;
    return { ...row, id: String(row.id), name: row.nama };
  } catch (error) {
    console.error("[telegram-login] carian gagal", error);
    return null;
  }
}

/** Telegram ini boleh log masuk sebagai staf `userId` (satu Telegram, satu staf). */
export async function linkTelegramLogin(userId: number, tgId: string): Promise<boolean> {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(telegramLogins)
        .where(and(eq(telegramLogins.telegramUserId, tgId), ne(telegramLogins.userId, userId)));
      await tx
        .insert(telegramLogins)
        .values({ userId, telegramUserId: tgId, linkedAt: new Date() })
        .onConflictDoUpdate({
          target: telegramLogins.userId,
          set: { telegramUserId: tgId, linkedAt: new Date() },
        });
    });
    return true;
  } catch (error) {
    console.error("[telegram-login] gagal menyimpan", error);
    return false;
  }
}

/**
 * Staf yang baru log masuk dengan ID + kata laluan di dalam Mini App: jika Telegram yang
 * membukanya ialah Telegram yang sudah tersimpan pada akaunnya, rekodkan untuk log masuk
 * (dia telah membuktikan kedua-duanya). Telegram lain tidak disambungkan di sini.
 */
export async function linkTelegramLoginIfSaved(userId: number, tgId: string): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      columns: { aktif: true, telegramChatId: true },
      where: eq(users.id, userId),
    });
    if (!user?.aktif || user.telegramChatId !== tgId) return false;
  } catch {
    return false;
  }
  return linkTelegramLogin(userId, tgId);
}

/** Putus sambungan Telegram: tiada lagi log masuk melalui Telegram. */
export async function unlinkTelegramLogin(userId: number): Promise<void> {
  try {
    await db.delete(telegramLogins).where(eq(telegramLogins.userId, userId));
  } catch (error) {
    console.error("[telegram-login] gagal memadam", error);
  }
}
