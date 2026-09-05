import Link from "next/link";
import type { CSSProperties } from "react";
import { getAdminBookingNotificationCount } from "@/lib/admin/booking-hub";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan } from "@/lib/roles";
import { countPendingKhidmatBantu } from "@/lib/khidmat-bantu/queries";
import {
  LAPORAN_HUB,
  RESOURCES_HUB,
  TEMPAHAN_HUB,
  getModuleAccent,
} from "@/lib/module-theme";
import {
  countPendingEquipmentLoansByPkg,
  listEquipmentPkgs,
} from "@/lib/peralatan/queries";
import { countPendingBookings, listPkgs } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

type AdminCard = {
  href: string;
  title: string;
  description: string;
  accent: string;
  badge?: number;
};

export default async function AdminOverviewPage() {
  const user = await requireUser();
  const urusKandungan = canManageKandungan(user.peranan);
  const khidmatPending = urusKandungan ? await countPendingKhidmatBantu() : 0;
  let tempahanPending = 0;
  try {
    const allPkgs = await listPkgs();
    const visiblePkgIds =
      user.peranan === "PKG_Admin"
        ? allPkgs.filter((pkg) => pkg.id === user.pkgId).map((pkg) => pkg.id)
        : allPkgs.map((pkg) => pkg.id);
    tempahanPending = await countPendingBookings(visiblePkgIds);
  } catch {
    // Kad kekal boleh dibuka jika data tempahan belum tersedia.
  }
  let equipmentPending = 0;
  try {
    const allPkgs = await listEquipmentPkgs();
    const visiblePkgIds =
      user.peranan === "PKG_Admin"
        ? allPkgs.filter((pkg) => pkg.id === user.pkgId).map((pkg) => pkg.id)
        : allPkgs.map((pkg) => pkg.id);
    const pendingByPkg = await countPendingEquipmentLoansByPkg(visiblePkgIds);
    equipmentPending = Object.values(pendingByPkg).reduce(
      (sum, total) => sum + total,
      0,
    );
  } catch {
    // Modul belum dimigrasi; kad kekal boleh dibuka untuk arahan pengaktifan.
  }

  const bookingPending = getAdminBookingNotificationCount(urusKandungan, {
    khidmatBantu: khidmatPending,
    tempahanBilik: tempahanPending,
    peralatan: equipmentPending,
  });

  const cards: AdminCard[] = [
    {
      href: "/admin/booking",
      title: TEMPAHAN_HUB.title,
      description: urusKandungan
        ? "Khidmat Bantu, Tempahan Bilik dan Aset dalam satu tempat."
        : "Tempahan Bilik dan Aset dalam satu tempat.",
      accent: TEMPAHAN_HUB.accent,
      badge: bookingPending,
    },
  ];
  if (urusKandungan) {
    cards.push(
      {
        href: "/admin/direktori",
        title: "CoE Directory",
        description: "Maklumat perhubungan sekolah, sejarah versi dan eksport CSV.",
        accent: getModuleAccent("/direktori"),
      },
      {
        href: "/admin/pelaporan",
        title: "CoE Reports",
        description: "Semak laporan DPD, PSS dan Akhbar daerah Manjung.",
        accent: LAPORAN_HUB.accent,
      },
      {
        href: "/admin/resources",
        title: "CoE Resources",
        description: "Urus tajuk dan pautan surat, pekeliling dan nota.",
        accent: RESOURCES_HUB.accent,
      },
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Selamat datang, {user.nama}
      </h1>
      <p className="mt-1 text-sm text-graphite">
        Pilih perkhidmatan untuk mula menguruskan urusan pentadbiran.
      </p>

      {cards.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
            Perkhidmatan
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="card admin-hub-card relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-modal"
                style={{ "--module-accent": c.accent } as CSSProperties}
              >
                {c.badge ? (
                  <span
                    className="absolute right-3 top-3 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white"
                    aria-label={`${c.badge} permohonan baharu menunggu tindakan`}
                  >
                    {c.badge > 9 ? "9+" : c.badge}
                  </span>
                ) : null}
                <p className="font-semibold">{c.title}</p>
                <p className="mt-1 text-sm text-graphite">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="card mt-8 p-6 text-sm text-graphite">
          Gunakan <span className="font-semibold text-ink">Tempahan</span> di menu
          di atas untuk mengurus tempahan PKG anda.
        </div>
      )}
    </>
  );
}
