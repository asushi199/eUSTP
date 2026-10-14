import { NextResponse } from "next/server";
import { requireKandunganAccess } from "@/lib/rbac";
import { csvKehadiranMjkd } from "@/lib/mjkd/csv";
import { isJenisKehadiran, JENIS_KEHADIRAN_LABEL } from "@/lib/mjkd/kehadiran";
import { getMesyuarat, listKehadiran } from "@/lib/mjkd/queries";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  await requireKandunganAccess();
  const { id } = await params;
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) return NextResponse.json({ error: "Mesyuarat tidak dijumpai" }, { status: 404 });
  try {
    const rekod = (await listKehadiran(mesyuarat.id)).reverse(); // lama dahulu
    const csv = csvKehadiranMjkd(
      rekod.map((r) => ({
        tarikh: r.tarikh,
        masa: r.createdAt.toLocaleTimeString("sv-SE", { timeZone: "Asia/Kuala_Lumpur" }),
        nama: r.nama,
        jawatan: r.jawatan,
        organisasi: r.organisasi,
        jenis: isJenisKehadiran(r.jenis) ? JENIS_KEHADIRAN_LABEL[r.jenis] : r.jenis,
        kodSekolah: r.schoolCode ?? "",
      })),
    );
    const nama = `Kehadiran-MJKD-Bil${mesyuarat.bil}-${mesyuarat.tahun}.csv`;
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
