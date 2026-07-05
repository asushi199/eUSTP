import type { ReactNode, SVGProps } from "react";

const ICONS: Record<string, ReactNode> = {
  aircond: (
    <>
      <rect height="8" rx="2" width="18" x="3" y="5" />
      <path d="M7 16v1.5M12 16v2.5M17 16v1.5" />
    </>
  ),
  projector: (
    <>
      <rect height="10" rx="2" width="18" x="3" y="7" />
      <circle cx="9" cy="12" r="2.4" />
      <path d="M15 11h2.5M6 21l1.5-3M18 21l-1.5-3" />
    </>
  ),
  smartboard: (
    <>
      <rect height="12" rx="2" width="18" x="3" y="4" />
      <path d="M12 16v3M9 19h6" />
    </>
  ),
  whiteboard: (
    <>
      <rect height="12" rx="2" width="18" x="3" y="4" />
      <path d="M7.5 9.5l4 4M16.5 8.5l-5 5" />
    </>
  ),
  wifi: (
    <>
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8 15.5a6 6 0 0 1 8 0" />
      <circle cx="12" cy="18.5" r="0.6" fill="currentColor" />
    </>
  ),
  audio: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
    </>
  ),
  microphone: (
    <>
      <rect height="11" rx="3" width="6" x="9" y="2" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  chairs: (
    <>
      <path d="M6 4v8h12V4M6 12l-1 8M18 12l1 8M5 16h14" />
    </>
  ),
  tables: (
    <>
      <path d="M3 8h18M5 8v12M19 8v12M3 8l2-3h14l2 3" />
    </>
  ),
  tv: (
    <>
      <rect height="12" rx="2" width="18" x="3" y="4" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  green_screen: (
    <>
      <rect height="13" rx="2" width="18" x="3" y="4" />
      <circle cx="12" cy="9.5" r="2" />
      <path d="M8.5 15a3.5 3.5 0 0 1 7 0" />
    </>
  ),
  studio_light: (
    <>
      <rect height="8" rx="1.5" width="11" x="6.5" y="3" />
      <path d="M12 11v7M8.5 21h7M9 6.5h6" />
    </>
  ),
  camera: (
    <>
      <rect height="10" rx="2" width="12" x="3" y="7" />
      <path d="M15 10.5l6-3.5v10l-6-3.5z" />
    </>
  ),
  teleprompter: (
    <>
      <rect height="10" rx="2" width="15" x="3" y="4" />
      <path d="M6.5 8h8M6.5 11h5M10.5 14v5M7 19h7" />
    </>
  ),
};

const FALLBACK = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </>
);

export default function AmenityIcon({
  name,
  className,
  ...props
}: { name: string; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      className={className ?? "h-4 w-4 shrink-0"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
      {...props}
    >
      {ICONS[name] ?? FALLBACK}
    </svg>
  );
}
