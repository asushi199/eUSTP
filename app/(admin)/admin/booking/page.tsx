import Link from "next/link";
import { HomeModuleIcon } from "@/components/home/HomeModuleIcon";
import { getAdminBookingSections } from "@/lib/admin/booking-hub";
import { countPendingKhidmatBantu } from "@/lib/khidmat-bantu/queries";
import {
  countPendingEquipmentLoansByPkg,
  listEquipmentPkgs,
} from "@/lib/peralatan/queries";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan } from "@/lib/roles";
import { countPendingBookings, listPkgs } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

const SECTION_ICON = {
  "Khidmat Bantu": "khidmat",
  "Tempahan Bilik": "tempahan",
  Aset: "peralatan",
} as const;

async function countPendingPeralatan(pkgId?: string | null) {
  try {
    const pkgs = await listEquipmentPkgs();
    const visible = pkgId ? pkgs.filter((pkg) => pkg.id === pkgId) : pkgs;
    const byPkg = await countPendingEquipmentLoansByPkg(visible.map((pkg) => pkg.id));
    return Object.values(byPkg).reduce((total, count) => total + count, 0);
  } catch {
    return 0;
  }
}

export default async function AdminBookingHubPage() {
  const user = await requireUser();
  const canManageContent = canManageKandungan(user.peranan);
  const visiblePkgs = await listPkgs();
  const roomPkgIds =
    user.peranan === "PKG_Admin"
      ? visiblePkgs.filter((pkg) => pkg.id === user.pkgId).map((pkg) => pkg.id)
      : visiblePkgs.map((pkg) => pkg.id);
  const [khidmatBantu, tempahanBilik, peralatan] = await Promise.all([
    canManageContent ? countPendingKhidmatBantu() : Promise.resolve(0),
    countPendingBookings(roomPkgIds),
    countPendingPeralatan(user.peranan === "PKG_Admin" ? user.pkgId : null),
  ]);
  const sections = getAdminBookingSections({
    canManageKandungan: canManageContent,
    pending: { khidmatBantu, tempahanBilik, peralatan },
  });

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">CoE Booking</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Pilih Urusan</h1>
      <p className="mt-1 text-sm text-graphite">
        Pilih Khidmat Bantu, Tempahan Bilik atau Aset untuk diuruskan.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const iconKey = SECTION_ICON[section.title as keyof typeof SECTION_ICON];
          return (
            <Link
              key={section.href}
              href={section.href}
              className="card group relative flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-modal focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {section.badge ? (
                <span
                  className="absolute right-3 top-3 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white"
                  aria-label={`${section.badge} permohonan baharu menunggu tindakan`}
                >
                  {section.badge > 9 ? "9+" : section.badge}
                </span>
              ) : null}
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
                <HomeModuleIcon iconKey={iconKey} />
              </span>
              <span className="min-w-0 flex-1 pr-4">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{section.title}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-0.5"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-graphite">
                  {section.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
