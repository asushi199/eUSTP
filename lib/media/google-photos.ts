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

const GENERIC_TITLES = new Set(["google photos", "photos", "shared album"]);

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

/** Buang akhiran Google dan tajuk generik yang tidak berguna. */
export function cleanGooglePhotosAlbumTitle(raw: string): string | null {
  let title = decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
  title = title.replace(/\s*[-–—|]\s*Google Photos\s*$/i, "").trim();
  if (!title || GENERIC_TITLES.has(title.toLowerCase())) return null;
  return title.slice(0, 300);
}

export function parseGooglePhotosAlbumTitle(html: string): string | null {
  const titleTag = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  const ogTitle =
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i.exec(html);
  return cleanGooglePhotosAlbumTitle(titleTag?.[1] ?? "") ?? cleanGooglePhotosAlbumTitle(ogTitle?.[1] ?? "");
}

const TITLE_FETCH_TIMEOUT_MS = 8000;

/** Baca tajuk album daripada halaman kongsi awam. Gagal = null. */
export async function fetchGooglePhotosAlbumTitle(url: string): Promise<string | null> {
  if (!isGooglePhotosUrl(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TITLE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(normalizeGooglePhotosUrl(url), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    return parseGooglePhotosAlbumTitle(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
