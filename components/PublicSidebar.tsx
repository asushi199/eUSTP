"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandWordmark from "./BrandWordmark";
import { cn } from "@/lib/cn";
import { PUBLIC_NAV, isPublicNavActive } from "@/lib/public-navigation";

export default function PublicSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r hairline bg-white no-print md:flex">
      <div className="flex h-16 items-center px-5">
        <BrandWordmark />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-6" aria-label="Menu utama">
        {PUBLIC_NAV.map((item) => {
          const active = isPublicNavActive(pathname, item);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2.5 text-[15px] leading-snug",
                active
                  ? "bg-cloud font-semibold text-ink"
                  : "text-graphite hover:bg-cloud hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
