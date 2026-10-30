import Link from "next/link";
import { notFound } from "next/navigation";
import TempahanAdminView from "@/components/tempahan/TempahanAdminView";
import { requireTempahanAccess } from "@/lib/rbac";
import { parseBulan, todayParts } from "@/lib/month-view";
import { getKioskConfig } from "@/lib/tempahan/kiosk";
import {
  getPkg,
  listPendingBookings,
  listPkgMonthBookings,
  listRooms,
} from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

const ACTION_CLASS =
  "flex min-h-[64px] flex-col items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-fog bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.7px] text-ink transition hover:border-steel active:scale-[0.99] sm:h-9 sm:min-h-0 sm:flex-row sm:gap-2 sm:rounded-md sm:px-4 sm:py-0 sm:text-xs";

const iconProps = {
  className: "h-5 w-5 text-graphite sm:h-4 sm:w-4",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export default async function AdminPkgTempahanPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string }>;
  searchParams: Promise<{ bulan?: string; view?: string }>;
}) {
  const { pkg: pkgId } = await params;
  const { bulan, view } = await searchParams;
  await requireTempahanAccess(pkgId);

  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const { year, month } = parseBulan(bulan) ?? todayParts();

  const [pending, monthBookings, rooms] = await Promise.all([
    listPendingBookings(pkgId),
    listPkgMonthBookings(pkgId, year, month),
    listRooms(pkgId, true),
  ]);
  const roomNames = Object.fromEntries(rooms.map((r) => [r.slug, r.name]));

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/tempahan" className="text-sm text-graphite hover:text-ink">
            ← Semua PKG
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{pkg.name}</h1>
        </div>
        {/* Telefon: jubin ikon sama lebar (label tidak berbalut); sm+: butang kecil sebaris. */}
        <div className="grid auto-cols-fr grid-flow-col gap-2 sm:flex">
          {getKioskConfig(pkgId) && (
            <a
              href={`/kiosk/${pkgId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={ACTION_CLASS}
              aria-label="Paparan Kiosk (tab baharu)"
            >
              <svg {...iconProps}>
                <rect x="6" y="2" width="12" height="16" rx="1.5" />
                <path d="M12 18v3M8 21h8" />
              </svg>
              <span>
                <span className="sm:hidden">Kiosk</span>
                <span className="hidden sm:inline">Paparan Kiosk</span> ↗
              </span>
            </a>
          )}
          <Link href={`/admin/tempahan/${pkgId}/bilik`} className={ACTION_CLASS}>
            <svg {...iconProps}>
              <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
              <path d="M3 21h18M14.5 12h.01" />
            </svg>
            <span>Urus Bilik</span>
          </Link>
          <Link href={`/admin/tempahan/${pkgId}/tetapan`} className={ACTION_CLASS}>
            <svg {...iconProps}>
              <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
              <circle cx="15" cy="6" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
            <span>Tetapan</span>
          </Link>
        </div>
      </div>

      <TempahanAdminView
        pkgId={pkgId}
        pending={pending}
        monthBookings={monthBookings}
        roomNames={roomNames}
        year={year}
        month={month}
        initialView={view === "senarai" ? "senarai" : "kalendar"}
      />
    </>
  );
}
