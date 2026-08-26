export type TelegramResponsibleUserOption = {
  id: number;
  nama: string;
  jawatan: string;
  peranan: string;
  telegramBoundAt: Date | null;
};

export type ParsedTelegramResponsibleUserId =
  | { ok: true; userId: number | null }
  | { ok: false };

export function resolveTelegramRecipientChatIds(
  configuredChatId: string | null,
  legacyChatIds: string[],
): string[] {
  if (configuredChatId) return [configuredChatId];
  return [...new Set(legacyChatIds)];
}

export function parseTelegramResponsibleUserId(
  raw: string,
): ParsedTelegramResponsibleUserId {
  const text = raw.trim();
  if (!text) return { ok: true, userId: null };
  if (!/^[1-9]\d*$/.test(text)) return { ok: false };
  return { ok: true, userId: Number(text) };
}

export function formatTelegramResponsibleOption(
  user: TelegramResponsibleUserOption,
): string {
  const roleLabel = user.jawatan.trim() || user.peranan;
  return `${user.nama} — ${roleLabel}${
    user.telegramBoundAt ? "" : " (Telegram belum disambungkan)"
  }`;
}

export function getVisibleTelegramRecipientPkgs<T extends { id: string }>(
  pkgs: T[],
  peranan: string,
  pkgId?: string | null,
): T[] {
  if (peranan !== "PKG_Admin") return pkgs;
  return pkgId ? pkgs.filter((pkg) => pkg.id === pkgId) : [];
}
