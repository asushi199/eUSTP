"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Tab = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: React.ReactNode;
};

const iconProps = {
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
} as const;

const TABS: Tab[] = [
  {
    href: "/",
    label: "Utama",
    match: (p) => p === "/",
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/laporan",
    label: "Laporan",
    match: (p) => p.startsWith("/laporan"),
    icon: (
      <svg {...iconProps}>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4" />
        <path d="M10 12h6M10 16h6" />
      </svg>
    ),
  },
  {
    href: "/sumber",
    label: "Sumber",
    match: (p) => p.startsWith("/sumber") || p.startsWith("/analisis"),
    icon: (
      <svg {...iconProps}>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    href: "/direktori",
    label: "Direktori",
    match: (p) => p.startsWith("/direktori"),
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
      </svg>
    ),
  },
  {
    href: "/tempahan",
    label: "Tempahan",
    match: (p) => p.startsWith("/tempahan"),
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    ),
  },
];

/** Tab bawah untuk mudah alih (halaman awam sahaja). */
export default function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-white pb-[env(safe-area-inset-bottom)] md:hidden no-print">
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-primary" : "text-graphite hover:text-ink",
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
