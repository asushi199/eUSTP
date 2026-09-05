const GOOGLE_PHOTOS_HOSTS = new Set([
  "photos.app.goo.gl",
  "photos.google.com",
  "www.photos.google.com",
]);

const URL_IN_TEXT = /https?:\/\/[^\s<>"'）】\]]+/gi;
const BARE_PHOTOS_IN_TEXT =
  /(?:www\.)?(?:photos\.app\.goo\.gl|photos\.google\.com)\/[^\s<>"'）】\]]+/gi;

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[).,;!?]+$/g, "");
}

function coerceHttpUrl(value: string): string {
  const trimmed = stripTrailingPunctuation(value.trim());
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(?:www\.)?(?:photos\.app\.goo\.gl|photos\.google\.com)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function isGooglePhotosUrl(value: string): boolean {
  try {
    const url = new URL(coerceHttpUrl(value));
    return GOOGLE_PHOTOS_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function normalizeGooglePhotosUrl(value: string): string {
  return coerceHttpUrl(value);
}

/** Ambil pautan album Google Photos daripada teks atau kapsyen. */
export function extractGooglePhotosUrl(text: string | undefined | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (isGooglePhotosUrl(trimmed)) return normalizeGooglePhotosUrl(trimmed);

  const matches = [...(trimmed.match(URL_IN_TEXT) ?? []), ...(trimmed.match(BARE_PHOTOS_IN_TEXT) ?? [])];
  for (const raw of matches) {
    const cleaned = normalizeGooglePhotosUrl(raw);
    if (isGooglePhotosUrl(cleaned)) return cleaned;
  }
  return null;
}
