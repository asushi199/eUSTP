import Link from "next/link";
import { cn } from "@/lib/cn";

/** Wordmark eUSTP dengan aksen chevron biru (anggukan kepada slash hp). */
export default function BrandWordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span aria-hidden className="text-lg font-bold leading-none text-primary">
        {"//"}
      </span>
      <span className="text-lg font-bold leading-none tracking-tight text-ink">
        eUSTP
        <span className="ml-1.5 font-medium text-graphite">Manjung</span>
      </span>
    </Link>
  );
}
