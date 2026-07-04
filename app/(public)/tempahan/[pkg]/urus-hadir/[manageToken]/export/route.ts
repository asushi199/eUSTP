import { NextResponse } from "next/server";
import { csvCell } from "@/lib/direktori/config";
import { getBookingByManageToken, listAttendees } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pkg: string; manageToken: string }> },
) {
  const { pkg: pkgId, manageToken } = await params;

  const booking = await getBookingByManageToken(pkgId, manageToken);
  if (!booking) {
    return NextResponse.json({ ok: false, error: "Pautan tidak sah" }, { status: 404 });
  }

  const attendees = await listAttendees(pkgId, booking.id);
  const header = ["bil", "nama", "telefon_emel", "masa_daftar"];
  const rows = attendees.map((a, i) => [
    String(i + 1),
    a.name,
    a.contact,
    a.createdAt.toISOString(),
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  const filename = `kehadiran-${booking.date}-${booking.roomSlug}.csv`;
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
