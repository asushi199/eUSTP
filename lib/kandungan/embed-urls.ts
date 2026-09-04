/**
 * Transformasi URL untuk pratonton iframe/imej — port TS daripada
 * ustp-dashboard_link_googlesheet/src/lib/embedUrls.js (fungsi tulen, boleh diuji).
 */

/** Canva — `/view` + `?embed` untuk iframe (`/watch` → `/view`). Hash (#page) selepas query. */
export function canvaViewEmbedUrl(viewUrl: string): string {
  let u = String(viewUrl ?? "").trim();
  if (!u) return u;
  u = u.replace(/\/watch\/?(\?|#|$)/i, "/view$1");
  const hashIdx = u.indexOf("#");
  const base = hashIdx >= 0 ? u.slice(0, hashIdx) : u;
  const hash = hashIdx >= 0 ? u.slice(hashIdx) : "";
  const withEmbed = base.includes("?") ? `${base}&embed` : `${base}?embed`;
  return `${withEmbed}${hash}`;
}

/** ID fail Google Drive daripada URL paparan, pratonton, atau imej lh3. */
export function driveFileId(url: string): string | null {
  const s = String(url ?? "");
  const fileD = s.match(/\/file\/d\/([^/?]+)/);
  if (fileD?.[1]) return fileD[1];
  if (/drive\.google\.com/i.test(s)) {
    const openId = s.match(/[?&]id=([^&]+)/);
    if (openId?.[1]) return openId[1];
  }
  const lh3 = s.match(/lh3\.googleusercontent\.com\/d\/([^/=?#]+)/);
  return lh3?.[1] ?? null;
}

/** Google Drive fail — URL paparan → `/preview` untuk iframe. */
export function driveFilePreviewUrl(viewUrl: string): string {
  const id = driveFileId(viewUrl);
  return id ? `https://drive.google.com/file/d/${id}/preview` : String(viewUrl ?? "");
}

/** Imej pratonton resolusi tinggi (muka surat PDF Drive). */
export function driveHiResImageUrl(url: string, width = 2048): string | null {
  const id = driveFileId(url);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${width}` : null;
}

/** Google Drive fail — pautan muat turun terus. */
export function driveFileDownloadUrl(url: string): string | null {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
}

/** Google Docs — `/preview` untuk iframe. */
export function googleDocPreviewUrl(docUrl: string): string {
  const m = String(docUrl ?? "").match(/\/document\/d\/([^/?]+)/);
  return m ? `https://docs.google.com/document/d/${m[1]}/preview` : docUrl;
}

/** Looker Studio — `/reporting/` tidak boleh dalam iframe; perlu `/embed/reporting/`. */
export function lookerStudioEmbedUrl(url: string): string {
  const s = String(url ?? "").trim();
  if (!s) return s;
  if (/lookerstudio\.google\.com\/reporting\//i.test(s) && !/\/embed\/reporting\//i.test(s)) {
    return s.replace(
      /lookerstudio\.google\.com\/reporting\//i,
      "lookerstudio.google.com/embed/reporting/",
    );
  }
  return s;
}

/** ID video YouTube daripada URL tontonan / live / pendek. */
export function youtubeVideoId(url: string): string | null {
  const m = String(url ?? "").match(
    /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/** Pautan Drive imej → URL imej terus (lh3) untuk <img>. */
export function driveImageUrl(url: string): string {
  const s = String(url ?? "").trim();
  const id = driveFileId(s);
  if (id) return `https://lh3.googleusercontent.com/d/${id}`;
  return s;
}

export type KandunganCardType =
  | "pdf"
  | "canva"
  | "gdoc"
  | "embed"
  | "youtube"
  | "image"
  | "link";

export type CardEmbedInfo =
  | { mode: "iframe"; src: string }
  | { mode: "image"; src: string }
  | { mode: "youtube"; videoId: string }
  | { mode: "none" };

/** Label jenis untuk lencana kad. */
export const CARD_TYPE_LABEL: Record<KandunganCardType, string> = {
  pdf: "PDF",
  canva: "Canva",
  gdoc: "Dokumen",
  embed: "Dashboard",
  youtube: "YouTube",
  image: "Imej",
  link: "Pautan",
};

/** Tentukan cara pratonton kad (dipanggil semasa render pelayan). */
export function resolveCardEmbed(
  type: KandunganCardType,
  url: string,
  previewUrl?: string,
): CardEmbedInfo {
  const target = (previewUrl ?? "").trim() || url;
  switch (type) {
    case "pdf":
      return { mode: "iframe", src: driveFilePreviewUrl(target) };
    case "canva":
      return { mode: "iframe", src: canvaViewEmbedUrl(target) };
    case "gdoc":
      return { mode: "iframe", src: googleDocPreviewUrl(target) };
    case "embed":
      return { mode: "iframe", src: lookerStudioEmbedUrl(target) };
    case "youtube": {
      const id = youtubeVideoId(target);
      return id ? { mode: "youtube", videoId: id } : { mode: "none" };
    }
    case "image":
      return { mode: "image", src: driveImageUrl(target) };
    case "link":
      return { mode: "none" };
  }
}
