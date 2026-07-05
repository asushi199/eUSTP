import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

/** Wordmark eUSTP dengan logo rasmi USTP. */
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
      aria-label="eUSTP Manjung — laman utama"
    >
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-primary/20 bg-white shadow-lift">
        <Image src="/ustp-logo.png" alt="" fill className="object-cover" sizes="36px" />
      </span>
      <span className="inline-flex items-baseline gap-1.5">
        <span className="text-lg font-bold leading-none tracking-tight text-ink">
          eUSTP
          <span className="ml-1.5 font-medium text-graphite">Manjung</span>
        </span>
      </span>
    </Link>
  );
}
