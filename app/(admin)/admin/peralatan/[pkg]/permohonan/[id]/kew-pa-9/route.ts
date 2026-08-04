import { NextRequest } from "next/server";
import { buildKewPa9Data, generateKewPa9Pdf } from "@/lib/peralatan/kew-pa9";
import { getEquipmentLoanDetail } from "@/lib/peralatan/queries";
import type { EquipmentDocumentStage } from "@/lib/peralatan/types";
import { requireTempahanAccess } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isDocumentStage(value: string | null): value is EquipmentDocumentStage {
  return value === "handover" || value === "final";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pkg: string; id: string }> },
) {
  const { pkg: pkgId, id } = await params;
  await requireTempahanAccess(pkgId);
  const stageParam = request.nextUrl.searchParams.get("stage");
  if (!isDocumentStage(stageParam)) {
    return new Response("Peringkat dokumen tidak sah.", { status: 400 });
  }
  const stage = stageParam;
  const detail = await getEquipmentLoanDetail(pkgId, id);
  if (!detail) return new Response("Permohonan tidak dijumpai.", { status: 404 });

  if (stage === "handover" && detail.status !== "handed_over") {
    return new Response("KEW.PA-9 semasa pinjaman hanya selepas serahan.", {
      status: 409,
    });
  }
  if (stage === "final" && detail.status !== "returned") {
    return new Response("Pemulangan belum dilengkapkan.", {
      status: 409,
    });
  }

  try {
    const buffer = await generateKewPa9Pdf(buildKewPa9Data(detail));
    const safeReference = detail.referenceNo.replace(/[^a-zA-Z0-9_-]+/g, "-");
    const fileName =
      stage === "final"
        ? `KEW.PA-9-${safeReference}-selepas-pemulangan.pdf`
        : `KEW.PA-9-${safeReference}-pinjaman.pdf`;
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
