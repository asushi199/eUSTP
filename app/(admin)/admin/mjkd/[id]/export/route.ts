import { NextResponse } from "next/server";
import { requireKandunganAccess } from "@/lib/rbac";
import { binaCsvMaklumBalasMesyuarat } from "@/lib/mjkd/admin-data";
import { getMesyuarat } from "@/lib/mjkd/queries";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  await requireKandunganAccess();
  const { id } = await params;
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) return NextResponse.json({ error: "Mesyuarat tidak dijumpai" }, { status: 404 });
  try {
    const csv = await binaCsvMaklumBalasMesyuarat(mesyuarat.id);
    const nama = `Maklum-Balas-MJKD-Bil${mesyuarat.bil}-${mesyuarat.tahun}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nama}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Eksport gagal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
