import { NextRequest } from "next/server";
import { buildKewPa17Data, generateKewPa17Pdf } from "@/lib/peralatan/kew-pa17";
import { getEquipmentTransferBatchDetail } from "@/lib/peralatan/queries";
import { requireTempahanAccess } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pkg: string; id: string }> },
) {
  const { pkg: pkgId, id } = await params;
  const user = await requireTempahanAccess(pkgId);
  if (user.peranan === "PKG_Admin") {
    return new Response("Akses pemindahan aset tidak dibenarkan.", { status: 403 });
  }

  const detail = await getEquipmentTransferBatchDetail(pkgId, id);
  if (!detail) return new Response("Rekod pindahan tidak dijumpai.", { status: 404 });

  try {
    const buffer = await generateKewPa17Pdf(buildKewPa17Data(detail));
    const safeReference = detail.referenceNo.replace(/[^a-zA-Z0-9_-]+/g, "-");
    return new Response(Uint8Array.from(buffer).buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="KEW.PA-17-${safeReference}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[peralatan] Gagal menjana KEW.PA-17", error);
    return new Response("PDF tidak dapat dijana.", { status: 500 });
  }
}
