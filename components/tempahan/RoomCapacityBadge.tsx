import { formatCapacity } from "@/lib/tempahan/room-capacity";
import { cn } from "@/lib/cn";

export default function RoomCapacityBadge({
  capacity,
  className,
  prominent = false,
}: {
  capacity: number | null | undefined;
  className?: string;
  /** Lebih ketara pada kad / hero. */
  prominent?: boolean;
}) {
  const label = formatCapacity(capacity);
  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold tabular-nums",
        prominent
          ? "bg-primary-soft/40 px-2.5 py-0.5 text-xs text-primary-deep ring-1 ring-primary/20"
          : "bg-cloud px-2 py-0.5 text-[11px] text-charcoal",
        className,
      )}
      title="Kapasiti bilik"
    >
      <svg
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 opacity-80"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      {label}
    </span>
  );
}
