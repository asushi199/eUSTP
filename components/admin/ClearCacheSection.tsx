"use client";

import { useState, useTransition } from "react";
import { kosongkanCacheData } from "@/lib/actions/cache";

/** Butang kosongkan cache data — untuk ubahan terus dalam Supabase / skrip tanpa cangkuk. */
export default function ClearCacheSection() {
  const [pending, startTransition] = useTransition();
  const [mesej, setMesej] = useState<string | null>(null);

  return (
    <section className="card mt-6 p-5">
      <h2 className="text-lg font-semibold">Cache data laman</h2>
      <p className="mt-1 text-sm text-graphite">
        Halaman utama, Ains, direktori, Resources dan Media dicache sehingga 24 jam untuk
        menjimatkan kuota Supabase. Perubahan melalui laman ini, NexaBot dan skrip import
        dikemas kini serta-merta. Jika data diubah terus dalam Supabase, tekan butang ini.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-outline-ink disabled:opacity-50"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setMesej(null);
              try {
                const res = await kosongkanCacheData();
                setMesej(res.ok ? "Cache dikosongkan. Data terkini akan dimuat pada lawatan seterusnya." : "Gagal.");
              } catch {
                setMesej("Gagal mengosongkan cache. Cuba lagi.");
              }
            })
          }
        >
          {pending ? "Mengosongkan…" : "Kosongkan cache"}
        </button>
        {mesej ? <p className="text-sm text-graphite">{mesej}</p> : null}
      </div>
    </section>
  );
}
