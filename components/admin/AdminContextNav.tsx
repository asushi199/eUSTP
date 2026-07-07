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

const TEMPAHAN_ICON = (
  <svg {...iconProps}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </svg>
);

const OSC_ICON = (
  <svg {...iconProps}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);

const PELAPORAN_ICON = (
  <svg {...iconProps}>
    <path d="M7 3h8l4 4v14H7z" />
    <path d="M15 3v4h4" />
    <path d="M10 12h6M10 16h6" />
  </svg>
);

/** Rangkaian laluan yang dikira sebagai "OSC" untuk sorotan tab. */
const OSC_PATHS = [
  "/admin/osc",
  "/admin/kandungan",
  "/admin/analisis",
  "/admin/pegawai",
  "/admin/tetapan",
];

/** Rangkaian laluan yang dikira sebagai "Pelaporan" untuk sorotan tab. */
const PELAPORAN_PATHS = [
  "/admin/pelaporan",
  "/admin/laporan-dpd",
  "/admin/laporan-pss",
];

function matchPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Pautan konteks admin dalam header (desktop). `showContent` ikut peranan. */
export function AdminDesktopNav({ showContent }: { showContent: boolean }) {
  const pathname = usePathname();

  const linkCls = (active: boolean) =>
    cn(
      "rounded-md px-3 py-2 text-sm",
      active
        ? "bg-cloud font-medium text-ink"
        : "text-graphite hover:bg-cloud hover:text-ink",
    );

  const items = [
    { href: "/admin", label: "Papan Admin", active: pathname === "/admin" },
    {
      href: "/admin/tempahan",
      label: "Tempahan",
      active: pathname.startsWith("/admin/tempahan"),
    },
    ...(showContent
      ? [
          {
            href: "/admin/osc",
            label: "OSC",
            active: matchPath(pathname, OSC_PATHS),
          },
          {
            href: "/admin/pelaporan",
            label: "Pelaporan",
            active: matchPath(pathname, PELAPORAN_PATHS),
          },
        ]
      : []),
  ];

  return (
    <nav aria-label="Navigasi admin" className="hidden items-center gap-1 md:flex">
      <Link
        href="/"
        className="rounded-md px-3 py-2 text-sm text-graphite hover:bg-cloud hover:text-ink"
      >
        Portal Pengguna
      </Link>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={linkCls(item.active)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Bar bawah tetap (mudah alih) — tab konteks admin.
 * `showContent` dihantar dari layout mengikut peranan
 * (PKG_Admin tiada OSC/Pelaporan).
 */
export function AdminMobileNav({ showContent }: { showContent: boolean }) {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/admin",
      label: "Papan",
      icon: ADMIN_HOME_ICON,
      active: pathname === "/admin",
    },
    {
      href: "/admin/tempahan",
      label: "Tempahan",
      icon: TEMPAHAN_ICON,
      active: pathname.startsWith("/admin/tempahan"),
    },
    ...(showContent
      ? [
          {
            href: "/admin/osc",
            label: "OSC",
            icon: OSC_ICON,
            active: matchPath(pathname, OSC_PATHS),
          },
          {
            href: "/admin/pelaporan",
            label: "Lapor",
            icon: PELAPORAN_ICON,
            active: matchPath(pathname, PELAPORAN_PATHS),
          },
        ]
      : []),
    {
      href: "/",
      label: "Portal",
      icon: PORTAL_ICON,
      active: false,
    },
  ];

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
              "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
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
