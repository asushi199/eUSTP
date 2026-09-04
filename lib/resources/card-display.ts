import {
  CARD_TYPE_LABEL,
  resolveCardEmbed,
  youtubeVideoId,
  type KandunganCardType,
} from "@/lib/kandungan/embed-urls";

/** Anggar jenis kad daripada URL — borang admin hanya minta tajuk + pautan. */
export function inferResourceCardType(url: string): KandunganCardType {
  const u = url.trim();
  if (/canva\.com/i.test(u)) return "canva";
  if (youtubeVideoId(u) || /youtube\.com|youtu\.be/i.test(u)) return "youtube";
  if (/docs\.google\.com\/document/i.test(u)) return "gdoc";
  if (/lookerstudio\.google\.com/i.test(u)) return "embed";
  if (/drive\.google\.com/i.test(u) || /\.pdf(\?|#|$)/i.test(u)) return "pdf";
  if (/\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(u)) return "image";
  return "link";
}

export function resourceCardDisplay(url: string) {
  const type = inferResourceCardType(url);
  return {
    type,
    typeLabel: CARD_TYPE_LABEL[type],
    embed: resolveCardEmbed(type, url),
  };
}
