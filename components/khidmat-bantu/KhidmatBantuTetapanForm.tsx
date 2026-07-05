"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveKhidmatBantuTetapan } from "@/lib/actions/khidmat-bantu-admin";

export default function KhidmatBantuTetapanForm({
  whatsappAdminPhone,
}: {
  whatsappAdminPhone: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveKhidmatBantuTetapan(formData);
      if (!res.ok) {
        setError("Gagal menyimpan tetapan.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="whatsappAdminPhone">
          No. WhatsApp Admin (untuk mesej kelulusan)
        </label>
        <input
          id="whatsappAdminPhone"
          name="whatsappAdminPhone"
          className="input"
          inputMode="tel"
          placeholder="cth. 60123456789"
          defaultValue={whatsappAdminPhone}
        />
        <p className="mt-1 text-xs text-graphite">
          Gunakan format antarabangsa tanpa &quot;+&quot; (cth. 60123456789).
        </p>
      </div>

      {error && <p className="text-sm text-bloom-deep">{error}</p>}
      {saved && <p className="text-sm text-primary-deep">Tetapan disimpan.</p>}
      <button type="submit" className="btn-primary btn-sm" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
    </form>
  );
}
