import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { APP_DISPLAY_NAME, APP_LOGO_SRC, APP_SHORT_NAME } from "@/lib/branding";

/** Wordmark NEXa dengan logo rasmi. */
export default function BrandWordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label={`${APP_DISPLAY_NAME} — laman utama`}
    >
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-white shadow-lift">
        <Image
          src={APP_LOGO_SRC}
          alt=""
          fill
          className="object-contain p-0.5"
          sizes="36px"
        />
      </span>
      <span className="text-lg font-bold leading-none tracking-tight text-ink">
        {APP_SHORT_NAME}
      </span>
    </Link>
  );
}
