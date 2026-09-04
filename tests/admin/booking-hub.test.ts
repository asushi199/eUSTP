import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdminBookingNotificationCount,
  getAdminBookingSections,
} from "../../lib/admin/booking-hub";

test("shows the three CoE Services management services with their pending notifications", () => {
  assert.deepEqual(
    getAdminBookingSections({
      canManageKandungan: true,
      pending: { khidmatBantu: 2, tempahanBilik: 3, peralatan: 1 },
    }),
    [
      {
        href: "/admin/khidmat-bantu",
        title: "Khidmat Bantu",
        description: "Kelulusan permohonan ceramah, bengkel, MCP dan lain-lain.",
        badge: 2,
      },
      {
        href: "/admin/tempahan",
        title: "Tempahan Bilik",
        description: "Urus tempahan bilik dan kemudahan PKG.",
        badge: 3,
      },
      {
        href: "/admin/peralatan",
        title: "Aset",
        description: "Urus inventori dan permohonan pinjaman peralatan.",
        badge: 1,
      },
    ],
  );
});

test("keeps only services available to PKG administrators", () => {
  assert.deepEqual(
    getAdminBookingSections({
      canManageKandungan: false,
      pending: { khidmatBantu: 7, tempahanBilik: 0, peralatan: 4 },
    }),
    [
      {
        href: "/admin/tempahan",
        title: "Tempahan Bilik",
        description: "Urus tempahan bilik dan kemudahan PKG.",
      },
      {
        href: "/admin/peralatan",
        title: "Aset",
        description: "Urus inventori dan permohonan pinjaman peralatan.",
        badge: 4,
      },
    ],
  );
});

test("counts only notifications for services the administrator can manage", () => {
  const pending = { khidmatBantu: 2, tempahanBilik: 3, peralatan: 1 };

  assert.equal(getAdminBookingNotificationCount(true, pending), 6);
  assert.equal(getAdminBookingNotificationCount(false, pending), 4);
});
