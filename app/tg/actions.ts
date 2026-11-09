"use server";

/* /tg di pelayan: log masukkan staf yang Telegramnya membuka Mini App (lib/telegram/web-app-login.ts,
   disemak semula oleh log masuk "telegram" dalam lib/auth.ts) dan terus ke halaman yang diminta —
   atau beritahu sebabnya jika tidak boleh. */
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { needsStaffAuth, safePath } from "@/lib/auth-paths";
import { auth, signIn } from "@/lib/auth";
import {
  findTelegramLoginUser,
  linkTelegramLoginIfSaved,
  telegramAppUser,
} from "@/lib/telegram/web-app-login";

export type TgOpenError = "bad" | "old" | "notLinked";

export async function tgOpen(
  initData: string,
  ke: string,
): Promise<{ error: TgOpenError } | undefined> {
  const to = safePath(ke);
  const session = await auth();
  const signedInId =
    session?.user && session.user.authKind !== "moe-dl" ? session.user.id || null : null;

  const tg = telegramAppUser(initData);
  if (tg.ok) {
    const linked = await findTelegramLoginUser(tg.tgId);
    if (linked && linked.id !== signedInId) {
      try {
        /* berjaya = kuki sesi ditetapkan dan terus ke `to` (redirect) */
        await signIn("telegram", { initData, redirectTo: to });
      } catch (error) {
        if (error instanceof AuthError) return { error: "bad" };
        throw error;
      }
    }
    /* baru log masuk dengan ID + kata laluan di dalam Mini App: sambungkan jika Telegram ini miliknya */
    if (!linked && signedInId) await linkTelegramLoginIfSaved(Number(signedInId), tg.tgId);
    if (linked || signedInId) redirect(to);
  } else if (signedInId) {
    redirect(to);
  }

  /* halaman awam (cth. kelulusan tempahan bertoken) tidak perlu log masuk */
  if (!needsStaffAuth(to.split("?")[0])) redirect(to);
  return { error: tg.ok ? "notLinked" : tg.error };
}
