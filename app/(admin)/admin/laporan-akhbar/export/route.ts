import { NextResponse } from "next/server";
import { requireKandunganAccess } from "@/lib/rbac";
import { buildLaporanAkhbarWorkbook } from "@/lib/laporan-akhbar/export";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireKandunganAccess();
  try {
    const { buffer, filename } = await buildLaporanAkhbarWorkbook();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Eksport gagal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
