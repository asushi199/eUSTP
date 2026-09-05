import { resourceCardDisplay, type ResourcesSectionCard } from "@/lib/resources/card-display";
import { toResourcesExplorerGroups } from "@/lib/resources/search";

/** Drive boleh jadi video, PDF atau imej — lencana tunjuk punca, bukan tekaan format. */
export function mediaCardDisplay(url: string) {
  const display = resourceCardDisplay(url);
  if (/drive\.google\.com/i.test(url.trim())) {
    return { ...display, typeLabel: "Drive" };
  }
  return display;
}

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
      const display = mediaCardDisplay(c.url);
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

export function toMediaExplorerGroups(
  groups: Parameters<typeof toResourcesExplorerGroups>[0],
) {
  return toResourcesExplorerGroups(groups).map((g) => ({
    ...g,
    cards: g.cards.map((c) => ({
      ...c,
      typeLabel: mediaCardDisplay(c.url).typeLabel,
    })),
  }));
}
