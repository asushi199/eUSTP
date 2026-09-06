"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_PAPAN_NESTED_PATHS } from "@/lib/admin/desktop-navigation";
import { getAdminMobileNavigation } from "@/lib/admin/mobile-navigation";
import { cn } from "@/lib/cn";

const iconProps = {
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
} as const;

const PORTAL_ICON = (
  <svg {...iconProps}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);

const PAPAN_ICON = (
  <svg {...iconProps}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="5" rx="1.5" />
    <rect x="13" y="12" width="8" height="9" rx="1.5" />
    <rect x="3" y="15" width="8" height="6" rx="1.5" />
  </svg>
);

function matchPath(pathname: string, paths: readonly string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Bar bawah tetap (mudah alih) — Papan + Portal. */
export function AdminMobileNav() {
  const pathname = usePathname();
  const icons = {
    papan: PAPAN_ICON,
    portal: PORTAL_ICON,
  } as const;
  const tabs = getAdminMobileNavigation().map((tab) => ({
    ...tab,
    icon: icons[tab.id],
    active:
      tab.id === "papan" &&
      (pathname === "/admin" || matchPath(pathname, ADMIN_PAPAN_NESTED_PATHS)),
  }));

  return (
    <nav
      aria-label="Navigasi admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-white pb-[env(safe-area-inset-bottom)] md:hidden no-print"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium whitespace-nowrap",
              tab.active ? "text-primary" : "text-graphite hover:text-ink",
            )}
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
