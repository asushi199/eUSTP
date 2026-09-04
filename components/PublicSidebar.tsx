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

      <div className="portal-sidebar-photo relative z-10 mx-3 mb-3 overflow-hidden rounded-2xl">
        <Image
          src="/ppd-manjung-banner.jpg"
          alt="Pejabat Pendidikan Daerah Manjung"
          width={640}
          height={360}
          className="h-28 w-full object-cover object-[70%_55%]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b3a66]/85 to-transparent px-3 pb-2.5 pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            PPD Manjung
          </p>
          <p className="text-[11px] leading-snug text-white/80">
            One Hub. Infinite Learning.
          </p>
        </div>
      </div>
    </aside>
  );
}
