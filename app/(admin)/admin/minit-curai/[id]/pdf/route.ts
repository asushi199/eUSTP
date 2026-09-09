import { getMinitCurai } from "@/lib/minit-curai/queries";
import { generateMinitCuraiPdf } from "@/lib/minit-curai/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getMinitCurai(id);
  const headers = { "Cache-Control": "private, no-store" };
  if (!report) return Response.json({ error: "Minit tidak dijumpai." }, { status: 404, headers });
  try {
    const bytes = await generateMinitCuraiPdf(report);
    return new Response(Buffer.from(bytes), {
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Minit-Curai-${report.meetingDate}-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[minit-curai/pdf]", error);
    return Response.json({ error: "PDF tidak dapat dijana. Sila cuba lagi." }, { status: 502, headers });
  }
}
