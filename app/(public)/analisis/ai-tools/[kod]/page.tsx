import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AnalisisAiToolsSchoolPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const code = kod.trim().toUpperCase();
  redirect(`/analisis/ai-tools?sekolah=${encodeURIComponent(code)}`);
}
