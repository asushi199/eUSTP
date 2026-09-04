import {
  CARD_TYPE_LABEL,
  resolveCardEmbed,
  youtubeVideoId,
  type CardEmbedInfo,
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

export type ResourcesSectionCard = {
  id: number;
  title: string;
  url: string;
  aktif: boolean;
  typeLabel: string;
  embed: CardEmbedInfo;
};

export type ResourcesSectionGroup = {
  slug: string;
  title: string;
  blurb: string;
  cards: ResourcesSectionCard[];
};

export function toResourcesSectionGroups(
  groups: Array<{
    slug: string;
    title: string;
    blurb: string;
    cards: Array<{ id: number; title: string; url: string; aktif: boolean }>;
  }>,
): ResourcesSectionGroup[] {
  return groups.map((g) => ({
    slug: g.slug,
    title: g.title,
    blurb: g.blurb,
    cards: g.cards.map((c) => {
      const display = resourceCardDisplay(c.url);
      return {
        id: c.id,
        title: c.title,
        url: c.url,
        aktif: c.aktif,
        typeLabel: display.typeLabel,
        embed: display.embed,
      };
    }),
  }));
}
