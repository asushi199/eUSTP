import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageKandungan } from "@/lib/roles";
import { listAdminSchools } from "@/lib/direktori/queries";
import {
  ROLE_ORDER,
  csvCell,
  type TeacherRole,
} from "@/lib/direktori/config";

export const dynamic = "force-dynamic";

function parseRoles(value: string | null): TeacherRole[] {
  const requested = String(value ?? "")
    .split(",")
    .map((v) => v.trim().toUpperCase())
    .filter(Boolean);
  const roles = ROLE_ORDER.filter((r) => requested.includes(r));
  return roles.length > 0 ? roles : ROLE_ORDER;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !canManageKandungan(session.user.peranan)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const url = new URL(request.url);
  const listType = url.searchParams.get("listType") === "schools" ? "schools" : "teachers";
  const roles = parseRoles(url.searchParams.get("roles"));

  const records = await listAdminSchools();

  let csv: string;
  if (listType === "schools") {
    const header = ["kod_sekolah", "nama_sekolah", "zon", "kemaskini_terakhir", "peranan_diisi"];
    const rows = records.map((r) => [
      r.schoolCode,
      r.schoolName,
      r.zone,
      r.submittedAt ? r.submittedAt.toISOString() : "",
      `${r.roles.filter((c) => c.teacherName || c.phone).length}/${ROLE_ORDER.length}`,
    ]);
    csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  } else {
    const selected = new Set(roles);
    const header = [
      "kod_sekolah",
      "nama_sekolah",
      "zon",
      "peranan",
      "nama_guru",
      "telefon",
      "kemaskini_terakhir",
    ];
    const rows = records.flatMap((r) =>
      r.roles
        .filter((c) => selected.has(c.role))
        .map((c) => [
          r.schoolCode,
          r.schoolName,
          r.zone,
          c.role,
          c.teacherName,
          c.phone,
          r.submittedAt ? r.submittedAt.toISOString() : "",
        ]),
    );
    csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  }

  const roleTag =
    listType === "teachers" && roles.length < ROLE_ORDER.length
      ? `-${roles.map((r) => r.toLowerCase()).join("-")}`
      : "";
  const filename = `direktori-${listType}${roleTag}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
