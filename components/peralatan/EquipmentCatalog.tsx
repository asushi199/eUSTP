"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  EquipmentCatalogItem,
  EquipmentPkg,
} from "@/lib/peralatan/types";

function totalAvailable(item: EquipmentCatalogItem) {
  return item.stocks.reduce((sum, stock) => sum + stock.available, 0);
}

function totalRegistered(item: EquipmentCatalogItem) {
  return item.stocks.reduce((sum, stock) => sum + stock.total, 0);
}

export default function EquipmentCatalog({
  items: catalogItems,
  pkgs,
}: {
  items: EquipmentCatalogItem[];
  pkgs: EquipmentPkg[];
}) {
  const [pkgId, setPkgId] = useState("semua");
  const [query, setQuery] = useState("");
  const pkgNames = useMemo(
    () => Object.fromEntries(pkgs.map((pkg) => [pkg.id, pkg.name])),
    [pkgs],
  );

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalogItems.filter((item) => {
      const searchableText = [
        item.name,
        item.model,
        item.description,
        ...item.searchAliases,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalized || searchableText.includes(normalized);
      const matchesPkg =
        pkgId === "semua" ||
        item.stocks.some((stock) => stock.pkgId === pkgId && stock.total > 0);
      return matchesQuery && matchesPkg;
    });
  }, [catalogItems, pkgId, query]);

  return (
    <>
      <section className="card mt-8 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div>
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
                className="absolute left-3 top-3 h-5 w-5 text-graphite"
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
              />
            </div>
          </div>
          <div>
            <label htmlFor="lokasi-pkg" className="label">
              Lokasi PKG
            </label>
            <select
              id="lokasi-pkg"
              className="input"
              value={pkgId}
              onChange={(event) => setPkgId(event.target.value)}
            >
              <option value="semua">Semua PKG</option>
              {pkgs.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {items.map((item) => {
          const visibleStocks = item.stocks.filter(
            (stock) => stock.total > 0 && (pkgId === "semua" || stock.pkgId === pkgId),
          );
          const requestPkg =
            pkgId === "semua"
              ? item.stocks.find((stock) => stock.available > 0)?.pkgId
              : pkgId;
          const isAvailable = requestPkg
            ? item.stocks.some(
                (stock) => stock.pkgId === requestPkg && stock.available > 0,
              )
            : false;

          return (
            <article key={item.id} className="card overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary-soft/25 font-mono text-sm font-bold tracking-wider text-primary-deep">
                  {item.code}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold leading-snug text-ink">{item.name}</h2>
                      <p className="mt-1 text-sm font-medium text-charcoal">{item.model}</p>
                    </div>
                    <span className="status-badge shrink-0">
                      <span className="status-dot bg-primary" />
                      {totalAvailable(item)} tersedia
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-graphite">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="border-y border-fog bg-cloud/70 px-5 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-[0.1em] text-graphite">
                    Daftar stok
                  </span>
                  <span className="text-graphite">
                    {totalAvailable(item)} / {totalRegistered(item)} unit tersedia
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fog">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.round(
                        (totalAvailable(item) / Math.max(totalRegistered(item), 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-2">
                  {visibleStocks.map((stock) => (
                    <div
                      key={stock.pkgId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-charcoal">
                        {pkgNames[stock.pkgId] ?? stock.pkgId}
                      </span>
                      <span
                        className={
                          stock.available > 0
                            ? "font-semibold text-ink"
                            : "font-medium text-graphite"
                        }
                      >
                        {stock.available} / {stock.total}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/tempahan/peralatan/mohon?item=${item.id}${
                    requestPkg ? `&pkg=${requestPkg}` : ""
                  }`}
                  aria-disabled={!isAvailable}
                  className={
                    isAvailable
                      ? "btn-primary mt-5 w-full"
                      : "btn-outline-ink pointer-events-none mt-5 w-full opacity-60"
                  }
                >
                  {isAvailable ? "Pilih peralatan" : "Stok tidak tersedia"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="card mt-5 p-10 text-center">
          <p className="font-semibold text-ink">Tiada peralatan dijumpai</p>
          <p className="mt-2 text-sm text-graphite">
            Cuba kata carian lain atau pilih semua lokasi PKG.
          </p>
        </div>
      ) : null}
    </>
  );
}
