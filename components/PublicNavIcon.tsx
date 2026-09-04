import type { PublicNavId } from "@/lib/public-navigation";

const iconProps = {
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function PublicNavIcon({ id }: { id: PublicNavId }) {
  switch (id) {
    case "utama":
      return (
        <svg {...iconProps}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    case "reports":
      return (
        <svg {...iconProps}>
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v4h4" />
          <path d="M10 12h6M10 16h6" />
        </svg>
      );
    case "services":
      return (
        <svg {...iconProps}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      );
    case "direktori":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...iconProps}>
          <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
        </svg>
      );
    case "resources":
      return (
        <svg {...iconProps}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case "media":
      return (
        <svg {...iconProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m10 9 6 3.5L10 16z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
