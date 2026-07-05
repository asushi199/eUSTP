"use client";

import { useState } from "react";
import type { ResolvedAmenity } from "@/lib/tempahan/amenities";
import AmenityIcon from "./AmenityIcon";

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RoomDetailHero({
  name,
  category,
  imageSrc,
  amenities,
}: {
  name: string;
  category: string;
  imageSrc: string | null;
  amenities: ResolvedAmenity[];
}) {
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  return (
    <>
      {/* Compact hero below xl */}
      <section className="mt-3 flex gap-3 xl:hidden">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border hairline bg-cloud">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-graphite">Tiada</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {category && (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{category}</p>
          )}
          <h1 className="truncate text-lg font-semibold tracking-tight">{titleCase(name)}</h1>
          {amenities.length > 0 && (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-primary hover:underline"
              onClick={() => setAmenitiesOpen((v) => !v)}
              aria-expanded={amenitiesOpen}
            >
              {amenities.length} kemudahan {amenitiesOpen ? "▴" : "▾"}
            </button>
          )}
        </div>
      </section>

      {amenitiesOpen && amenities.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5 xl:hidden">
          {amenities.map((item) => (
            <li
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5 text-xs text-graphite"
            >
              <AmenityIcon name={item.key} className="h-3 w-3" />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {/* Desktop: full hero */}
      <section className="mt-4 hidden gap-6 xl:grid xl:grid-cols-2 xl:items-start">
        <div className="overflow-hidden rounded-xl border hairline bg-cloud">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={`${name} - ${category}`}
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-graphite">Tiada gambar</div>
          )}
        </div>
        <div>
          {category && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{category}</p>
          )}
          <h1 className="mt-1 text-3xl font-medium tracking-tight">{titleCase(name)}</h1>
          <div className="mt-4">
            <h2 className="text-sm font-semibold">Kemudahan</h2>
            {amenities.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {amenities.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-sm text-graphite">
                    <AmenityIcon name={item.key} />
                    {item.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-graphite">Tiada maklumat kemudahan.</p>
            )}
          </div>
          <a href="#tempah" className="btn-primary mt-6 inline-flex">
            Tempah bilik ini
          </a>
        </div>
      </section>
    </>
  );
}
