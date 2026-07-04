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

/** Google Drive fail — URL paparan → `/preview` untuk iframe. */
export function driveFilePreviewUrl(viewUrl: string): string {
  const s = String(viewUrl ?? "");
  const fileD = s.match(/\/file\/d\/([^/?]+)/);
  if (fileD) return `https://drive.google.com/file/d/${fileD[1]}/preview`;
  if (s.includes("drive.google.com")) {
    const openId = s.match(/[?&]id=([^&]+)/);
    if (openId) return `https://drive.google.com/file/d/${openId[1]}/preview`;
  }
  return s;
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
  if (!/drive\.google\.com/i.test(s)) return s;
  const fileD = s.match(/\/file\/d\/([^/?]+)/);
  if (fileD) return `https://lh3.googleusercontent.com/d/${fileD[1]}`;
  const idParam = s.match(/[?&]id=([^&]+)/);
  if (idParam) return `https://lh3.googleusercontent.com/d/${idParam[1]}`;
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
