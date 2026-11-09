import type { Metadata } from "next";
import { safePath } from "@/lib/auth-paths";
import TgOpen from "./TgOpen";

export const metadata: Metadata = { title: "Telegram", robots: { index: false } };
export const dynamic = "force-dynamic";

/* Tempat butang NexaBot dibuka (lib/telegram/web-app.ts telegramOpenButton): dalam Telegram,
   Mini App log masukkan staf dan terus ke ?ke=; dibuka di tempat lain, terus ke ?ke=. */
export default async function TgPage({ searchParams }: { searchParams: Promise<{ ke?: string }> }) {
  const { ke } = await searchParams;
  return <TgOpen ke={safePath(ke)} />;
}
