import type { SubtopikGroup } from "@/lib/kandungan/queries";
import {
  CARD_TYPE_LABEL,
  resolveCardEmbed,
  type KandunganCardType,
} from "@/lib/kandungan/embed-urls";
import CardEmbed from "./CardEmbed";

/** Grid kad satu topik, disusun ikut subtopik (komponen pelayan). */
export default function CardGrid({ groups }: { groups: SubtopikGroup[] }) {
  if (groups.length === 0) {
    return <p className="py-8 text-center text-graphite">Tiada kandungan lagi.</p>;
  }
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.key}>
          {g.title ? (
            <header className="mb-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {g.icon ? <span aria-hidden>{g.icon}</span> : null}
                {g.title}
              </h2>
              {g.blurb ? (
                <p className="mt-0.5 text-sm leading-relaxed text-graphite">{g.blurb}</p>
              ) : null}
            </header>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.cards.map((c) => (
              <CardEmbed
                key={c.id}
                title={c.title}
                blurb={c.blurb}
                url={c.url}
                typeLabel={CARD_TYPE_LABEL[c.type as KandunganCardType]}
                embed={resolveCardEmbed(
                  c.type as KandunganCardType,
                  c.url,
                  c.previewUrl,
                )}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
