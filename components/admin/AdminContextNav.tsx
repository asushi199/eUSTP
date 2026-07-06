"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const ADMIN_HOME_ICON = (
  <svg {...iconProps}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <path d="M17 13v8M13 17h8" />
  </svg>
);

function useAdminNav() {
  const pathname = usePathname();
  return { onAdminHome: pathname === "/admin" };
}

/** Pautan konteks admin dalam header (desktop). */
export function AdminDesktopNav() {
  const { onAdminHome } = useAdminNav();

  return (
    <nav aria-label="Navigasi admin" className="hidden items-center gap-1 md:flex">
      <Link
        href="/"
        className="rounded-md px-3 py-2 text-sm text-graphite hover:bg-cloud hover:text-ink"
      >
        Portal Pengguna
      </Link>
      <Link
        href="/admin"
        aria-current={onAdminHome ? "page" : undefined}
        className={cn(
          "rounded-md px-3 py-2 text-sm",
          onAdminHome
            ? "bg-cloud font-medium text-ink"
            : "text-graphite hover:bg-cloud hover:text-ink",
        )}
      >
        Papan Admin
      </Link>
    </nav>
  );
}

/** Bar bawah tetap — portal awam & papan utama (mudah alih). */
export function AdminMobileNav() {
  const { onAdminHome } = useAdminNav();

  return (
    <nav
      aria-label="Navigasi admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-white pb-[env(safe-area-inset-bottom)] md:hidden no-print"
    >
      <div className="grid grid-cols-2">
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-graphite hover:text-ink"
        >
          {PORTAL_ICON}
          Portal
        </Link>
        <Link
          href="/admin"
          aria-current={onAdminHome ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
            onAdminHome ? "text-primary" : "text-graphite hover:text-ink",
          )}
        >
          {ADMIN_HOME_ICON}
          Papan Admin
        </Link>
      </div>
    </nav>
  );
}
