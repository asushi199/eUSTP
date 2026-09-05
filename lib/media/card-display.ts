import { resourceCardDisplay, type ResourcesSectionCard } from "@/lib/resources/card-display";
import { toResourcesExplorerGroups } from "@/lib/resources/search";

export { resourceCardDisplay as mediaCardDisplay };

export type MediaSectionCard = ResourcesSectionCard & {
  letterMonth: string | null;
  createdAt: string;
};

export type MediaSectionGroup = {
  slug: string;
  title: string;
  blurb: string;
  cards: MediaSectionCard[];
};

export function toMediaSectionGroups(
  groups: Array<{
    slug: string;
    title: string;
    blurb: string;
    cards: Array<{
      id: number;
      title: string;
      url: string;
      aktif: boolean;
      letterMonth?: string | null;
      createdAt: Date | string;
    }>;
  }>,
): MediaSectionGroup[] {
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
        letterMonth: c.letterMonth ?? null,
        createdAt:
          typeof c.createdAt === "string" ? c.createdAt : c.createdAt.toISOString(),
      };
    }),
  }));
}

export const toMediaExplorerGroups = toResourcesExplorerGroups;
