"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EquipmentCatalogItem } from "@/lib/peralatan/types";

function totalAvailable(item: EquipmentCatalogItem) {
  return item.stocks.reduce((sum, stock) => sum + stock.available, 0);
}

export default function EquipmentCatalog({
  items: catalogItems,
}: {
  items: EquipmentCatalogItem[];
}) {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalogItems.filter((item) => {
      if (totalAvailable(item) <= 0) return false;
      if (!normalized) return true;
      const searchableText = [
        item.name,
        item.model,
        item.description,
        ...item.searchAliases,
      ]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(normalized);
    });
  }, [catalogItems, query]);

  return (
    <>
      <div className="mt-8">
        <label htmlFor="carian-peralatan" className="label">
          Cari peralatan
        </label>
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-graphite"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            id="carian-peralatan"
            className="input pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nama atau model peralatan"
            autoComplete="off"
          />
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="card mt-5 divide-y divide-fog/80 overflow-hidden">
          {items.map((item) => {
            const available = totalAvailable(item);
            return (
              <li key={item.id}>
                <Link
                  href={`/tempahan/peralatan/mohon?item=${item.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-[background-color,transform] duration-150 hover:bg-cloud/90 active:bg-cloud focus-visible:bg-cloud/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/20 sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-snug text-ink">
                      {item.name}
                    </p>
                    {item.model ? (
                      <p className="mt-0.5 truncate text-sm text-graphite">
                        {item.model}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums leading-none text-primary sm:text-xl">
                      {available}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite">
                      tersedia
                    </p>
                  </div>
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-5 w-5 shrink-0 text-steel transition-colors duration-150 group-hover:text-ink"
                  >
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card mt-5 p-10 text-center">
          <p className="font-semibold text-ink">
            {query.trim()
              ? "Tiada peralatan dijumpai"
              : "Tiada peralatan tersedia"}
          </p>
          <p className="mt-2 text-sm text-graphite">
            {query.trim()
              ? "Cuba kata carian lain."
              : "Semua unit sedang dipinjam atau dalam penyelenggaraan."}
          </p>
        </div>
      )}
    </>
  );
}
