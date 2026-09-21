import { NextResponse } from "next/server";
import { requireKandunganAccess } from "@/lib/rbac";
import { getOptikSnapshotById } from "@/lib/analisis/optik-queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireKandunganAccess();
  const { id } = await context.params;
  const snapId = Number(id);
  if (!Number.isInteger(snapId)) {
    return NextResponse.json({ error: "Tidak sah" }, { status: 400 });
  }
  const row = await getOptikSnapshotById(snapId);
  if (!row) return NextResponse.json({ error: "Tidak dijumpai" }, { status: 404 });
  const filename = `ai-tools-${row.capturedOn}.csv`;
  return new NextResponse(row.rawCsv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
