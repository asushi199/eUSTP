export type AdminBookingPending = {
  khidmatBantu: number;
  tempahanBilik: number;
  peralatan: number;
};

export type AdminBookingSection = {
  href: string;
  title: string;
  description: string;
  badge?: number;
};

/** Bilangan notifikasi untuk lencana hub CoE Booking. */
export function getAdminBookingNotificationCount(
  canManageKandungan: boolean,
  pending: AdminBookingPending,
): number {
  return pending.tempahanBilik + pending.peralatan + (canManageKandungan ? pending.khidmatBantu : 0);
}

/** Pilihan urusan di bawah hub CoE Booking, mengikut capaian peranan. */
export function getAdminBookingSections({
  canManageKandungan,
  pending,
}: {
  canManageKandungan: boolean;
  pending: AdminBookingPending;
}): AdminBookingSection[] {
  const sections: AdminBookingSection[] = [];

  if (canManageKandungan) {
    sections.push({
      href: "/admin/khidmat-bantu",
      title: "Khidmat Bantu",
      description: "Kelulusan permohonan ceramah, bengkel, MCP dan lain-lain.",
      ...(pending.khidmatBantu > 0 ? { badge: pending.khidmatBantu } : {}),
    });
  }

  sections.push(
    {
      href: "/admin/tempahan",
      title: "Tempahan Bilik",
      description: "Urus tempahan bilik dan kemudahan PKG.",
      ...(pending.tempahanBilik > 0 ? { badge: pending.tempahanBilik } : {}),
    },
    {
      href: "/admin/peralatan",
      title: "Aset",
      description: "Urus inventori dan permohonan pinjaman peralatan.",
      ...(pending.peralatan > 0 ? { badge: pending.peralatan } : {}),
    },
  );

  return sections;
}
