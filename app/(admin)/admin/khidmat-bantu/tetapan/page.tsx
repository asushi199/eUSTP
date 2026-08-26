import Link from "next/link";
import KhidmatBantuTetapanForm from "@/components/khidmat-bantu/KhidmatBantuTetapanForm";
import {
  getKhidmatBantuTelegramResponsibleUserId,
  getKhidmatBantuWhatsappAdmin,
  listKhidmatBantuTelegramResponsibleUsers,
} from "@/lib/khidmat-bantu/queries";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminKhidmatBantuTetapanPage() {
  await requireKandunganAccess();
  const [whatsappAdminPhone, telegramResponsibleUserId, responsibleUsers] = await Promise.all([
    getKhidmatBantuWhatsappAdmin(),
    getKhidmatBantuTelegramResponsibleUserId(),
    listKhidmatBantuTelegramResponsibleUsers(),
  ]);

  return (
    <>
      <Link href="/admin/khidmat-bantu" className="text-sm text-graphite hover:text-ink">
        ← Permohonan Khidmat Bantu
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tetapan Khidmat Bantu</h1>
      <p className="mt-1 text-sm text-graphite">
        Nombor WhatsApp untuk mesej kelulusan permohonan khidmat bantu.
      </p>
      <div className="mt-6 max-w-lg">
        <KhidmatBantuTetapanForm
          whatsappAdminPhone={whatsappAdminPhone}
          telegramResponsibleUserId={telegramResponsibleUserId}
          responsibleUsers={responsibleUsers}
        />
      </div>
    </>
  );
}
