import {
  formatResourceMonthLabel,
  resourceMonthKey,
  type ResourcesExplorerCard,
} from "@/lib/resources/search";

export const RESOURCE_SEARCH_LIMIT = 8;

export function resourceSearchMonthLabel(card: {
  letterMonth?: string | null;
  createdAt: string;
}): string {
  if (card.letterMonth) return formatResourceMonthLabel(card.letterMonth);
  const uploaded = resourceMonthKey(card.createdAt);
  return uploaded ? formatResourceMonthLabel(uploaded) : "";
}

export function formatResourceSearchReply(
  query: string,
  cards: Array<
    Pick<ResourcesExplorerCard, "title" | "url" | "kategoriTitle" | "createdAt"> & {
      letterMonth?: string | null;
    }
  >,
  opts: { limit?: number } = {},
): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return [
      "Taip /cari diikuti kata kunci.",
      "Contoh: /cari eduspark atau /cari jun 2026",
    ].join("\n");
  }

  const limit = opts.limit ?? RESOURCE_SEARCH_LIMIT;
  if (cards.length === 0) {
    return `Tiada surat sepadan untuk "${trimmed}". Cuba tajuk, kumpulan atau bulan.`;
  }

  const shown = cards.slice(0, limit);
  const lines = [
    `Carian: ${trimmed}`,
    cards.length === 1 ? "1 surat dijumpai." : `${cards.length} surat dijumpai.`,
    "",
  ];

  shown.forEach((card, index) => {
    const title = card.title.trim().slice(0, 140);
    const month = resourceSearchMonthLabel(card);
    const meta = [card.kategoriTitle, month].filter(Boolean).join(" · ");
    lines.push(`${index + 1}. ${title}`);
    if (meta) lines.push(`   ${meta}`);
    lines.push(`   ${card.url}`);
    lines.push("");
  });

  if (cards.length > limit) {
    lines.push(`Menunjukkan ${limit} daripada ${cards.length}. Perhalusi kata carian.`);
  }

  return lines.join("\n").trim();
}
