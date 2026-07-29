import { NextRequest } from "next/server";
import { buildKewPa9Data, generateKewPa9Pdf } from "@/lib/peralatan/kew-pa9";
import { getEquipmentLoanDetail } from "@/lib/peralatan/queries";
import type { EquipmentDocumentStage } from "@/lib/peralatan/types";
import { requireTempahanAccess } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pkg: string; id: string }> },
) {
  const { pkg: pkgId, id } = await params;
  await requireTempahanAccess(pkgId);
  const stage = request.nextUrl.searchParams.get("stage");
  if (stage !== "final") {
    return new Response("KEW.PA-9 hanya dijana selepas pemulangan.", {
      status: 409,
    });
  }
  const detail = await getEquipmentLoanDetail(pkgId, id);
  if (!detail) return new Response("Permohonan tidak dijumpai.", { status: 404 });

  if (detail.status !== "returned") {
    return new Response("Pemulangan belum dilengkapkan.", {
      status: 409,
    });
  }

  try {
    const buffer = await generateKewPa9Pdf(
      buildKewPa9Data(detail),
      stage as EquipmentDocumentStage,
    );
    const safeReference = detail.referenceNo.replace(/[^a-zA-Z0-9_-]+/g, "-");
    const fileName = `KEW.PA-9-${safeReference}-untuk-tandatangan.pdf`;
    const body = Uint8Array.from(buffer).buffer;
    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[peralatan] Gagal menjana KEW.PA-9", error);
    return new Response("PDF tidak dapat dijana.", { status: 500 });
  }
}
