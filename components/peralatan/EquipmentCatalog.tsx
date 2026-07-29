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
        item.description,
        ...item.searchAliases,
        ...item.models.flatMap((model) => [
          model.code,
          model.name,
          model.model,
          model.description,
          ...model.searchAliases,
          ...model.specifications,
          ...model.components,
        ]),
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
        <ul className="mt-5 space-y-3">
          {items.map((item) => {
            const available = totalAvailable(item);
            return (
              <li key={item.id} className="card overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-ink">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-sm text-graphite">
                      {item.description}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums leading-none text-primary sm:text-xl">
                      {available}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite">
                      tersedia
                    </p>
                  </div>
                </div>
                <div className="border-t border-fog px-4 py-3 sm:px-5">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20">
                      Lihat butiran
                      <span
                        aria-hidden
                        className="text-lg leading-none transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="mt-4 grid gap-5 text-sm leading-relaxed text-graphite md:grid-cols-[minmax(0,1fr)_240px]">
                      <div>
                        <p className="font-semibold text-charcoal">
                          Model yang tersedia
                        </p>
                        <div className="mt-2 space-y-3">
                          {item.models
                            .filter((model) => model.total > 0)
                            .map((model) => (
                              <details
                                key={model.id}
                                className="rounded-lg border border-fog p-3"
                              >
                                <summary className="cursor-pointer list-none font-medium text-ink">
                                  <span>{model.model || model.name}</span>
                                  <span className="ml-2 text-xs font-normal text-graphite">
                                    {model.available.toLocaleString("ms-MY")} tersedia
                                  </span>
                                </summary>
                                {model.description ? (
                                  <p className="mt-3">{model.description}</p>
                                ) : null}
                                {model.specifications.length > 0 ? (
                                  <>
                                    <p className="mt-3 font-semibold text-charcoal">
                                      Spesifikasi
                                    </p>
                                    <ul className="mt-2 space-y-1.5">
                                      {model.specifications.map((specification) => (
                                        <li
                                          key={specification}
                                          className="flex gap-2"
                                        >
                                          <span aria-hidden className="text-steel">
                                            —
                                          </span>
                                          <span>{specification}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                ) : null}
                                {model.components.length > 0 ? (
                                  <>
                                    <p className="mt-3 font-semibold text-charcoal">
                                      Kandungan
                                    </p>
                                    <ul className="mt-2 space-y-1.5">
                                      {model.components.map((component) => (
                                        <li key={component} className="flex gap-2">
                                          <span aria-hidden className="text-steel">
                                            —
                                          </span>
                                          <span>{component}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                ) : null}
                              </details>
                            ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal">
                          Ketersediaan
                        </p>
                        <ul className="mt-2 space-y-1">
                          {item.stocks
                            .filter((stock) => stock.available > 0)
                            .map((stock) => (
                              <li
                                key={stock.pkgId}
                                className="flex justify-between gap-4"
                              >
                                <span>{stock.pkgName}</span>
                                <span className="font-semibold tabular-nums text-charcoal">
                                  {stock.available.toLocaleString("ms-MY")} tersedia
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                  <Link
                    href={`/tempahan/peralatan/mohon?item=${item.id}`}
                    className="btn-primary btn-sm mt-4"
                  >
                    Mohon pinjaman
                  </Link>
                </div>
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
