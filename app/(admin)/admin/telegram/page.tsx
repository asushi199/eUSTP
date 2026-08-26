import { eq } from "drizzle-orm";
import TelegramBindingCard from "@/components/admin/TelegramBindingCard";
import {
  createKhidmatTelegramBindingLink,
  createPkgTelegramBindingLink,
  createTelegramBindingLink,
  disconnectKhidmatTelegram,
  disconnectPkgTelegram,
  disconnectTelegram,
} from "@/lib/actions/telegram";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan } from "@/lib/roles";
import { users } from "@/lib/schema";
import { listPkgs } from "@/lib/tempahan/queries";
import {
  KHIDMAT_TELEGRAM_DESTINATION_ID,
  pkgTelegramDestinationId,
} from "@/lib/telegram/binding";
import { listTelegramDestinations } from "@/lib/telegram/destinations";
import { getVisibleTelegramRecipientPkgs } from "@/lib/telegram/recipients";

export const dynamic = "force-dynamic";

function formatBoundAt(value: Date | null | undefined): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("ms-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(value);
}

function isMissingTelegramTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("telegram_destinations") ||
    message.includes("telegram_responsible_user_id")
  );
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
  let destinationError: string | null = null;
  let pkgSections: Array<{
    id: string;
    name: string;
    connected: boolean;
    username: string | null;
    boundAt: string | null;
  }> = [];
  let khidmat:
    | { connected: boolean; username: string | null; boundAt: string | null }
    | null = null;

  try {
    const allPkgs = await listPkgs();
    const visiblePkgs = getVisibleTelegramRecipientPkgs(
      allPkgs,
      sessionUser.peranan,
      sessionUser.pkgId,
    );
    const destinationIds = [
      ...visiblePkgs.map((pkg) => pkgTelegramDestinationId(pkg.id)),
      ...(showKhidmat ? [KHIDMAT_TELEGRAM_DESTINATION_ID] : []),
    ];
    const destinations = await listTelegramDestinations(destinationIds);
    pkgSections = visiblePkgs.map((pkg) => {
      const destination = destinations.get(pkgTelegramDestinationId(pkg.id));
      return {
        id: pkg.id,
        name: pkg.name,
        connected: Boolean(destination?.chatId),
        username: destination?.username ?? null,
        boundAt: formatBoundAt(destination?.boundAt),
      };
    });
    if (showKhidmat) {
      const destination = destinations.get(KHIDMAT_TELEGRAM_DESTINATION_ID);
      khidmat = {
        connected: Boolean(destination?.chatId),
        username: destination?.username ?? null,
        boundAt: formatBoundAt(destination?.boundAt),
      };
    }
  } catch (error) {
    destinationError = isMissingTelegramTable(error)
      ? "Pangkalan data belum dikemaskini. Jalankan npm run db:migrate, kemudian muat semula halaman ini."
      : "Sambungan Telegram PKG tidak dapat dimuatkan sekarang.";
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Telegram</h1>
      <p className="mt-1 text-sm text-graphite">
        Jana pautan sambungan untuk setiap PKG. Pegawai buka pautan di Telegram
        dan tekan Start — tidak perlu log masuk portal.
      </p>

      <section className="mt-6 max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Sambungan mengikut PKG
        </h2>
        {destinationError ? (
          <div className="card border-amber-200 bg-amber-50/80 p-6 text-sm leading-relaxed text-graphite">
            <p className="font-semibold text-ink">Tetapan belum sedia</p>
            <p className="mt-2">{destinationError}</p>
          </div>
        ) : (
          <>
            {pkgSections.map((pkg) => (
              <TelegramBindingCard
                key={pkg.id}
                title={pkg.name}
                description="Pautan ini menyambungkan Telegram pegawai bagi Tempahan Bilik dan Peralatan PKG ini."
                connected={pkg.connected}
                username={pkg.username}
                boundAt={pkg.boundAt}
                generateAction={createPkgTelegramBindingLink.bind(null, pkg.id)}
                disconnectAction={disconnectPkgTelegram.bind(null, pkg.id)}
              />
            ))}
            {khidmat ? (
              <TelegramBindingCard
                title="Khidmat Bantu"
                description="Pautan ini menyambungkan Telegram pegawai yang menerima permohonan Khidmat Bantu."
                connected={khidmat.connected}
                username={khidmat.username}
                boundAt={khidmat.boundAt}
                generateAction={createKhidmatTelegramBindingLink}
                disconnectAction={disconnectKhidmatTelegram}
              />
            ) : null}
          </>
        )}
      </section>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Akaun Telegram pentadbir ini
        </h2>
        <p className="mt-1 text-sm text-graphite">
          Pilihan. Sambungan peribadi berasingan daripada sambungan PKG di atas.
        </p>
        <div className="mt-4">
          <TelegramBindingCard
            title="Notifikasi peribadi"
            description="Sambungkan akaun log masuk ini jika anda sendiri mahu menerima notifikasi."
            connected={Boolean(user?.telegramChatId)}
            username={user?.telegramUsername ?? null}
            boundAt={formatBoundAt(user?.telegramBoundAt)}
            generateAction={createTelegramBindingLink}
            disconnectAction={disconnectTelegram}
          />
        </div>
      </section>
    </>
  );
}
