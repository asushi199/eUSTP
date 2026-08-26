export function resolveTelegramRecipientChatIds(
  configuredChatId: string | null,
  legacyChatIds: string[],
): string[] {
  if (configuredChatId) return [configuredChatId];
  return [...new Set(legacyChatIds)];
}
