import { percentLabel, splitTebusStatus } from "@/lib/tebus-buku/progress";

const SEGMENTS = [
  { key: "selesai", label: "selesai", bar: "bg-ink", dot: "bg-ink" },
  { key: "belumGuna", label: "belum guna", bar: "bg-graphite", dot: "bg-graphite" },
  { key: "belumTebus", label: "belum tebus", bar: "bg-steel", dot: "bg-steel" },
] as const;

export default function TebusProgress({
  total,
  tebusCount,
  gunaCount,
  className = "",
}: {
  total: number;
  tebusCount: number;
  gunaCount: number;
  className?: string;
}) {
  const split = splitTebusStatus({ total, tebusCount, gunaCount });
  const counts = {
    selesai: split.selesai,
    belumGuna: split.belumGuna,
    belumTebus: split.belumTebus,
  };

  return (
    <div className={className}>
      <div className="flex h-2 overflow-hidden rounded-full bg-fog" aria-hidden>
        {SEGMENTS.map((segment) => {
          const count = counts[segment.key];
          if (count <= 0 || split.total <= 0) return null;
          return (
            <div
              key={segment.key}
              className={`h-full ${segment.bar}`}
              style={{ width: `${(count / split.total) * 100}%` }}
            />
          );
        })}
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-graphite">
        {SEGMENTS.map((segment) => (
          <span key={segment.key} className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${segment.dot}`} aria-hidden />
            {percentLabel(counts[segment.key], split.total)} {segment.label}
          </span>
        ))}
      </p>
    </div>
  );
}
