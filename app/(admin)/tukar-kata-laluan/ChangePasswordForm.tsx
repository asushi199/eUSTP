"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/actions/account";

export default function ChangePasswordForm() {
  const router = useRouter();
  const { update } = useSession();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      const res = await changePassword({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      if (!res.ok) {
        setError(res.error ?? "Gagal menukar kata laluan");
        return;
      }
      // Segarkan JWT supaya mustChangePassword=false
      await update({ mustChangePassword: false });
      setOkMsg("Kata laluan ditukar. Mengalihkan...");
      setTimeout(() => {
        router.replace("/admin");
        router.refresh();
      }, 800);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label">Kata Laluan Semasa</label>
        <input
          type="password"
          className="input"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Kata Laluan Baharu (min 8 aksara)</label>
        <input
          type="password"
          className="input"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Sahkan Kata Laluan Baharu</label>
        <input
          type="password"
          className="input"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && (
        <div className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
          {error}
        </div>
      )}
      {okMsg && (
        <div className="rounded-md border border-primary-soft bg-primary-soft/30 px-3 py-2 text-sm text-primary-deep">
          {okMsg}
        </div>
      )}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Memproses..." : "Tukar Kata Laluan"}
      </button>
    </form>
  );
}
