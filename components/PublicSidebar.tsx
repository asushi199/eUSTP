"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_LOGO_SRC, APP_SHORT_NAME } from "@/lib/branding";
import { cn } from "@/lib/cn";
import { PUBLIC_NAV, isPublicNavActive } from "@/lib/public-navigation";
import { PublicNavIcon } from "./PublicNavIcon";

export default function PublicSidebar() {
  const pathname = usePathname();

  return (
    <aside className="portal-sidebar no-print">
      <div className="relative z-10 flex h-[4.25rem] items-center gap-2.5 px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="NEXa — laman utama">
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
              by USTP Manjung
            </span>
          </span>
        </Link>
      </div>

      <nav className="relative z-10 flex flex-1 flex-col gap-1 px-3 pt-2" aria-label="Menu utama">
        {PUBLIC_NAV.map((item) => {
          const active = isPublicNavActive(pathname, item);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em]",
                active
                  ? "bg-primary text-white shadow-lift"
                  : "text-graphite hover:bg-white/80 hover:text-ink",
              )}
            >
              <PublicNavIcon id={item.id} />
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>

      <div className="portal-sidebar-brand">
        <div className="portal-sidebar-wash" aria-hidden>
          <Image
            src="/ppd-manjung-cutout.png"
            alt=""
            fill
            unoptimized
            sizes="16rem"
            className="object-cover object-[80%_100%]"
          />
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white">
            CoE Manjung
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/80">
            One Hub. Infinite Learning.
          </p>
        </div>
      </div>
    </aside>
  );
}
