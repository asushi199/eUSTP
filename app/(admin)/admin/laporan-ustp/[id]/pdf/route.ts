import { getUstpReport } from "@/lib/laporan-ustp/queries";
import { generateUstpPdf } from "@/lib/laporan-ustp/pdf";
import { driveFileIdFromPath } from "@/lib/gas-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getUstpReport(id);
  const headers = { "Cache-Control": "private, no-store" };
  if (!report) return Response.json({ error: "Laporan tidak dijumpai." }, { status: 404, headers });
  try {
    const photos = await Promise.all(report.photos.map(async (photo) => {
      const fileId = driveFileIdFromPath(photo.storagePath);
      if (!fileId || !/^[\w-]+$/.test(fileId)) throw new Error("Invalid image reference");
      const response = await fetch(`https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1920`, { cache: "no-store", signal: AbortSignal.timeout(20000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Image unavailable");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > 8 * 1024 * 1024) throw new Error("Image too large");
      return bytes;
    }));
    const bytes = await generateUstpPdf(report, photos);
    return new Response(Buffer.from(bytes), { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Laporan-USTP-${report.startDate}-${id}.pdf"` } });
  } catch {
    return Response.json({ error: "PDF tidak dapat dijana. Semak bahawa kedua-dua gambar boleh dibuka dan teks menggunakan aksara Rumi, kemudian cuba lagi." }, { status: 502, headers });
  }
}
