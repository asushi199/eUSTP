import ActionForm from "@/components/admin/ActionForm";
import { saveTelegramResponsible } from "@/lib/actions/telegram";
import {
  formatTelegramResponsibleOption,
  type TelegramResponsibleUserOption,
} from "@/lib/telegram/recipients";

export default function TelegramRecipientCard({
  title,
  description,
  fallbackLabel,
  scope,
  pkgId,
  selectedUserId,
  users,
}: {
  title: string;
  description: string;
  fallbackLabel: string;
  scope: "pkg" | "khidmat";
  pkgId?: string;
  selectedUserId: number | null;
  users: TelegramResponsibleUserOption[];
}) {
  const fieldId = `telegramResponsibleUserId-${scope}-${pkgId ?? "khidmat"}`;
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-graphite">{description}</p>
      <ActionForm
        action={saveTelegramResponsible}
        className="mt-4 space-y-3"
        submitLabel="Simpan"
        submitClassName="btn-ink btn-sm"
      >
        <input type="hidden" name="scope" value={scope} />
        {pkgId ? <input type="hidden" name="pkgId" value={pkgId} /> : null}
        <label className="label" htmlFor={fieldId}>
          Pegawai Telegram
        </label>
        <select
          id={fieldId}
          name="telegramResponsibleUserId"
          defaultValue={selectedUserId?.toString() ?? ""}
          className="input"
        >
          <option value="">{fallbackLabel}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {formatTelegramResponsibleOption(user)}
            </option>
          ))}
        </select>
      </ActionForm>
    </div>
  );
}
