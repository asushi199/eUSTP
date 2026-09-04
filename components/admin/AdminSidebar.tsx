"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getAdminDesktopNavigation,
  isAdminDesktopNavActive,
  type AdminDesktopNavigationItem,
} from "@/lib/admin/desktop-navigation";
import { APP_LOGO_SRC, APP_SHORT_NAME } from "@/lib/branding";
import { cn } from "@/lib/cn";

const iconProps = {
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

function AdminNavIcon({ href }: { href: AdminDesktopNavigationItem["href"] | "/" }) {
  if (href === "/") {
    return (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    );
  }
  if (href === "/admin") {
    return (
      <svg {...iconProps}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="12" width="8" height="9" rx="1.5" />
        <rect x="3" y="15" width="8" height="6" rx="1.5" />
      </svg>
    );
  }
  if (href === "/admin/osc") {
    return (
      <svg {...iconProps}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg {...iconProps}>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4" />
      <path d="M10 12h6M10 16h6" />
    </svg>
  );
}

export default function AdminSidebar({ showContent }: { showContent: boolean }) {
  const pathname = usePathname();
  const items = getAdminDesktopNavigation(showContent);

  return (
    <aside className="portal-sidebar no-print">
      <div className="portal-sidebar-wash" aria-hidden>
        <Image
          src="/ppd-manjung-banner.jpg"
          alt=""
          fill
          sizes="16rem"
          className="object-cover object-[78%_42%]"
        />
      </div>
      <div className="relative z-10 flex h-[4.25rem] items-center gap-2.5 px-5">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5" aria-label="NEXa — papan admin">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white shadow-lift">
            <Image
              src={APP_LOGO_SRC}
              alt=""
              fill
              className="object-contain p-1"
              sizes="40px"
            />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold leading-none tracking-tight text-ink">
              {APP_SHORT_NAME}
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
              Pentadbiran
            </span>
          </span>
        </Link>
      </div>

      <nav className="relative z-10 flex flex-1 flex-col gap-1 px-3 pt-2" aria-label="Navigasi admin">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-graphite hover:bg-white/80 hover:text-ink"
        >
          <AdminNavIcon href="/" />
          Portal Pengguna
        </Link>
        {items.map((item) => {
          const active = isAdminDesktopNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em]",
                active
                  ? "bg-primary text-white shadow-lift"
                  : "text-graphite hover:bg-white/80 hover:text-ink",
              )}
            >
              <AdminNavIcon href={item.href} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="portal-sidebar-brand">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
          Panel Admin
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-white/80">
          CoE Manjung
        </p>
      </div>
    </aside>
  );
}
