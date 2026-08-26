import { eq } from "drizzle-orm";
import TelegramBindingCard from "@/components/admin/TelegramBindingCard";
import TelegramRecipientCard from "@/components/admin/TelegramRecipientCard";
import { db } from "@/lib/db";
import {
  getKhidmatBantuTelegramResponsibleUserId,
  listKhidmatBantuTelegramResponsibleUsers,
} from "@/lib/khidmat-bantu/queries";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan } from "@/lib/roles";
import { users } from "@/lib/schema";
import {
  listPkgTelegramResponsibleUsers,
  listPkgs,
} from "@/lib/tempahan/queries";
import { getVisibleTelegramRecipientPkgs } from "@/lib/telegram/recipients";

export const dynamic = "force-dynamic";

function isMissingTelegramResponsibleColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("telegram_responsible_user_id");
}

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

  const showKhidmat = canManageKandungan(sessionUser.peranan);
  let recipientError: string | null = null;
  let pkgSections: Array<{
    id: string;
    name: string;
    selectedUserId: number | null;
    users: Awaited<ReturnType<typeof listPkgTelegramResponsibleUsers>>;
  }> = [];
  let khidmat:
    | {
        selectedUserId: number | null;
        users: Awaited<ReturnType<typeof listKhidmatBantuTelegramResponsibleUsers>>;
      }
    | null = null;

  try {
    const allPkgs = await listPkgs();
    const visiblePkgs = getVisibleTelegramRecipientPkgs(
      allPkgs,
      sessionUser.peranan,
      sessionUser.pkgId,
    );
    pkgSections = await Promise.all(
      visiblePkgs.map(async (pkg) => ({
        id: pkg.id,
        name: pkg.name,
        selectedUserId: pkg.telegramResponsibleUserId,
        users: await listPkgTelegramResponsibleUsers(pkg.id),
      })),
    );
    if (showKhidmat) {
      const [selectedUserId, khidmatUsers] = await Promise.all([
        getKhidmatBantuTelegramResponsibleUserId(),
        listKhidmatBantuTelegramResponsibleUsers(),
      ]);
      khidmat = { selectedUserId, users: khidmatUsers };
    }
  } catch (error) {
    recipientError = isMissingTelegramResponsibleColumn(error)
      ? "Pangkalan data belum dikemaskini. Jalankan npm run db:migrate, kemudian muat semula halaman ini."
      : "Tetapan pegawai Telegram tidak dapat dimuatkan sekarang.";
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Telegram</h1>
      <p className="mt-1 text-sm text-graphite">
        Sambungkan akaun dan pilih pegawai yang menerima notifikasi permohonan.
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

      <section className="mt-8 max-w-2xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Pegawai penerima notifikasi
          </h2>
          <p className="mt-1 text-sm text-graphite">
            Setiap PKG mempunyai seorang pegawai untuk Tempahan Bilik dan Peralatan.
            Jika belum dipilih, notifikasi kekal dihantar kepada penerima sedia ada.
          </p>
        </div>

        {recipientError ? (
          <div className="card border-amber-200 bg-amber-50/80 p-6 text-sm leading-relaxed text-graphite">
            <p className="font-semibold text-ink">Tetapan belum sedia</p>
            <p className="mt-2">{recipientError}</p>
          </div>
        ) : (
          <>
            {pkgSections.map((pkg) => (
              <TelegramRecipientCard
                key={pkg.id}
                title={pkg.name}
                description="Seorang pegawai menerima permohonan Bilik dan Peralatan bagi PKG ini."
                fallbackLabel="Gunakan penerima PKG sedia ada"
                scope="pkg"
                pkgId={pkg.id}
                selectedUserId={pkg.selectedUserId}
                users={pkg.users}
              />
            ))}
            {khidmat ? (
              <TelegramRecipientCard
                title="Khidmat Bantu"
                description="Seorang pegawai Admin atau Pegawai menerima semua permohonan Khidmat Bantu."
                fallbackLabel="Gunakan semua pentadbir sedia ada"
                scope="khidmat"
                selectedUserId={khidmat.selectedUserId}
                users={khidmat.users}
              />
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
