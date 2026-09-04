"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import {
  PUBLIC_MOBILE_MORE,
  PUBLIC_MOBILE_TABS,
  isPublicNavActive,
} from "@/lib/public-navigation";
import { PublicNavIcon } from "./PublicNavIcon";

function MoreIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

/** Tab bawah untuk mudah alih (halaman awam sahaja). */
export default function BottomTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const panelId = useId();
  const moreActive = PUBLIC_MOBILE_MORE.some((item) => isPublicNavActive(pathname, item));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <div className="md:hidden no-print">
      {moreOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Tutup menu Lagi"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Modul lain"
            className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] rounded-t-2xl bg-white p-4 shadow-modal"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
              Lagi
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PUBLIC_MOBILE_MORE.map((item) => {
                const active = isPublicNavActive(pathname, item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[11px] font-medium leading-tight",
                      active
                        ? "border-primary/30 bg-cloud text-primary"
                        : "border-fog text-graphite hover:border-steel hover:text-ink",
                    )}
                  >
                    <PublicNavIcon id={item.id} />
                    {item.shortLabel}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {PUBLIC_MOBILE_TABS.map((tab) => {
            const active = isPublicNavActive(pathname, tab);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-graphite hover:text-ink",
                )}
              >
                <PublicNavIcon id={tab.id} />
                {tab.shortLabel}
              </Link>
            );
          })}
          <button
            type="button"
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              moreOpen || moreActive ? "text-primary" : "text-graphite hover:text-ink",
            )}
            aria-expanded={moreOpen}
            aria-controls={panelId}
            onClick={() => setMoreOpen((open) => !open)}
          >
            <MoreIcon />
            Lagi
          </button>
        </div>
      </nav>
    </div>
  );
}
