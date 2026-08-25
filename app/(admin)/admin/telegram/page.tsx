import { eq } from "drizzle-orm";
import TelegramBindingCard from "@/components/admin/TelegramBindingCard";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { users } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function AdminTelegramPage() {
  const sessionUser = await requireUser();
  const user = await db.query.users.findFirst({
    columns: {
      telegramChatId: true,
      telegramUsername: true,
      telegramBoundAt: true,
    },
    where: eq(users.id, Number(sessionUser.id)),
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Telegram</h1>
      <p className="mt-1 text-sm text-graphite">
        Urus sambungan untuk menerima notifikasi permohonan yang memerlukan tindakan.
      </p>
      <TelegramBindingCard
        connected={Boolean(user?.telegramChatId)}
        username={user?.telegramUsername ?? null}
        boundAt={
          user?.telegramBoundAt
            ? new Intl.DateTimeFormat("ms-MY", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kuala_Lumpur",
              }).format(user.telegramBoundAt)
            : null
        }
      />
    </>
  );
}
