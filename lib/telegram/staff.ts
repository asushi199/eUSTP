import "server-only";

import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { getKhidmatBantuTelegramResponsibleUserId } from "@/lib/khidmat-bantu/queries";
import { canUseNexaBot, type UserPeranan } from "@/lib/roles";
import { pkgs, telegramDestinations, users } from "@/lib/schema";
import { KHIDMAT_TELEGRAM_DESTINATION_ID } from "./binding";
import { normalizeTelegramUsername, pickDestinationOwnerUserId } from "./staff-resolve";

export type TelegramStaff = { id: number; peranan: UserPeranan };
export { normalizeTelegramUsername, pickDestinationOwnerUserId };

function asStaff(user: { id: number; peranan: UserPeranan } | null | undefined): TelegramStaff | null {
  if (!user || !canUseNexaBot(user.peranan)) return null;
  return { id: user.id, peranan: user.peranan };
}

async function loadStaff(userId: number): Promise<TelegramStaff | null> {
  const user = await db.query.users.findFirst({
    columns: { id: true, peranan: true },
    where: and(eq(users.id, userId), eq(users.aktif, true)),
  });
  return asStaff(user);
}

async function findStaffForDestinationIds(destinationIds: string[]): Promise<TelegramStaff | null> {
  const pkgIds = destinationIds
    .filter((id) => id.startsWith("pkg:"))
    .map((id) => id.slice(4));
  const wantsKhidmat = destinationIds.includes(KHIDMAT_TELEGRAM_DESTINATION_ID);

  if (pkgIds.length > 0) {
    const pkgRows = await db
      .select({
        id: pkgs.id,
        telegramResponsibleUserId: pkgs.telegramResponsibleUserId,
      })
      .from(pkgs)
      .where(inArray(pkgs.id, pkgIds));
    for (const pkg of pkgRows) {
      if (pkg.telegramResponsibleUserId) {
        const staff = await loadStaff(pkg.telegramResponsibleUserId);
        if (staff) return staff;
      }
    }

    const pkgAdmins = await db
      .select({ id: users.id, peranan: users.peranan })
      .from(users)
      .where(
        and(
          eq(users.aktif, true),
          eq(users.peranan, "PKG_Admin"),
          inArray(users.pkgId, pkgIds),
        ),
      );
    if (pkgAdmins[0]) {
      const staff = asStaff(pkgAdmins[0]);
      if (staff) return staff;
    }
  }

  if (wantsKhidmat) {
    const responsibleId = await getKhidmatBantuTelegramResponsibleUserId();
    if (responsibleId) {
      const staff = await loadStaff(responsibleId);
      if (staff) return staff;
    }
  }

  const fallbackAdmin = await db.query.users.findFirst({
    columns: { id: true, peranan: true },
    where: and(eq(users.aktif, true), eq(users.peranan, "Admin")),
  });
  return asStaff(fallbackAdmin);
}

/** Akaun peribadi, nama Telegram, atau sambungan PKG/khidmat semuanya dikira terikat. */
export async function findStaffByTelegramIdentity(
  telegramUserId: string,
  telegramUsername?: string | null,
): Promise<TelegramStaff | null> {
  const byChat = await db.query.users.findFirst({
    columns: { id: true, peranan: true },
    where: and(eq(users.aktif, true), eq(users.telegramChatId, telegramUserId)),
  });
  const personal = asStaff(byChat);
  if (personal) return personal;

  const username = normalizeTelegramUsername(telegramUsername);
  if (username) {
    const boundUsers = await db
      .select({ id: users.id, peranan: users.peranan, telegramUsername: users.telegramUsername })
      .from(users)
      .where(and(eq(users.aktif, true), isNotNull(users.telegramBoundAt)));
    const byUsername = boundUsers.find(
      (user) => normalizeTelegramUsername(user.telegramUsername) === username,
    );
    const named = asStaff(byUsername);
    if (named) return named;
  }

  const destinations = await db
    .select({ id: telegramDestinations.id })
    .from(telegramDestinations)
    .where(eq(telegramDestinations.chatId, telegramUserId));
  if (destinations.length === 0) return null;
  return findStaffForDestinationIds(destinations.map((row) => row.id));
}

export async function attachTelegramIdentityToDestinationUser(
  destinationId: string,
  chatId: string,
  username: string | undefined,
): Promise<void> {
  const pkgId = destinationId.startsWith("pkg:") ? destinationId.slice(4) : null;
  let responsibleUserId: number | null = null;
  let pkgAdminIds: number[] = [];

  if (pkgId) {
    const pkg = await db.query.pkgs.findFirst({
      columns: { telegramResponsibleUserId: true },
      where: eq(pkgs.id, pkgId),
    });
    responsibleUserId = pkg?.telegramResponsibleUserId ?? null;
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(eq(users.aktif, true), eq(users.peranan, "PKG_Admin"), eq(users.pkgId, pkgId)),
      );
    pkgAdminIds = admins.map((row) => row.id);
  } else if (destinationId === KHIDMAT_TELEGRAM_DESTINATION_ID) {
    responsibleUserId = await getKhidmatBantuTelegramResponsibleUserId();
  }

  const fallbackAdmin = await db.query.users.findFirst({
    columns: { id: true },
    where: and(eq(users.aktif, true), eq(users.peranan, "Admin")),
  });
  const userId = pickDestinationOwnerUserId({
    responsibleUserId,
    pkgAdminIds,
    fallbackAdminId: fallbackAdmin?.id ?? null,
  });
  if (!userId) return;

  const existing = await db.query.users.findFirst({
    columns: { id: true, telegramChatId: true },
    where: eq(users.id, userId),
  });
  if (!existing || existing.telegramChatId) return;

  const taken = await db.query.users.findFirst({
    columns: { id: true },
    where: eq(users.telegramChatId, chatId),
  });
  if (taken) return;

  await db
    .update(users)
    .set({
      telegramChatId: chatId,
      telegramUsername: username ?? null,
      telegramBoundAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
