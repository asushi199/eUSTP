"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import {
  PUBLIC_MOBILE_MORE,
  PUBLIC_MOBILE_TABS,
  isPublicNavActive,
  type PublicNavItem,
} from "@/lib/public-navigation";

const iconProps = {
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

function TabIcon({ id }: { id: PublicNavItem["id"] }) {
  switch (id) {
    case "utama":
      return (
        <svg {...iconProps}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    case "reports":
      return (
        <svg {...iconProps}>
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v4h4" />
          <path d="M10 12h6M10 16h6" />
        </svg>
      );
    case "services":
      return (
        <svg {...iconProps}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case "direktori":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...iconProps}>
          <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
        </svg>
      );
    case "resources":
      return (
        <svg {...iconProps}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "media":
      return (
        <svg {...iconProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m10 9 6 3.5L10 16z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

function MoreIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
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
                    <TabIcon id={item.id} />
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
                <TabIcon id={tab.id} />
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
