export function normalizeTelegramUsername(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().replace(/^@/, "").toLowerCase() ?? "";
  return normalized || null;
}

export function pickDestinationOwnerUserId(opts: {
  responsibleUserId: number | null | undefined;
  pkgAdminIds: number[];
  fallbackAdminId: number | null | undefined;
}): number | null {
  if (opts.responsibleUserId) return opts.responsibleUserId;
  if (opts.pkgAdminIds.length > 0) return opts.pkgAdminIds[0];
  return opts.fallbackAdminId ?? null;
}
