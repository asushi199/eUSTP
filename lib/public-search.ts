import { HOME_MODULES } from "./home-modules";
import { PUBLIC_NAV } from "./public-navigation";

export type PublicSearchEntry = {
  href: string;
  label: string;
  group: string;
};

export function getPublicSearchEntries(): PublicSearchEntry[] {
  const seen = new Set<string>();
  const entries: PublicSearchEntry[] = [];

  function add(entry: PublicSearchEntry) {
    if (!entry.href || seen.has(entry.href)) return;
    seen.add(entry.href);
    entries.push(entry);
  }

  for (const item of PUBLIC_NAV) {
    add({ href: item.href, label: item.label, group: "Menu" });
  }

  for (const mod of HOME_MODULES) {
    add({ href: mod.href, label: mod.title, group: mod.title });
    for (const item of mod.items) {
      if (item.href) {
        add({ href: item.href, label: item.label, group: mod.title });
      }
    }
  }

  return entries;
}

export function searchPublicEntries(query: string): PublicSearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getPublicSearchEntries()
    .filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.group.toLowerCase().includes(q),
    )
    .slice(0, 8);
}
