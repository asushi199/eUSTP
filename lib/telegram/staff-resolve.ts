export function normalizeTelegramUsername(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().replace(/^@/, "").toLowerCase() ?? "";
  return normalized || null;
}

export function pickDestinationOwnerUserId(opts: {
  responsibleUserId: number | null | undefined;
  candidateUserIds: number[];
  fallbackUserId: number | null | undefined;
}): number | null {
  if (opts.responsibleUserId) return opts.responsibleUserId;
  if (opts.candidateUserIds.length > 0) return opts.candidateUserIds[0];
  return opts.fallbackUserId ?? null;
}
