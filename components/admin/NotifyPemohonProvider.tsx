"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NotifyPemohonDialog from "@/components/admin/NotifyPemohonDialog";
import type { NotifyPemohonPrompt } from "@/lib/admin/notify-pemohon";

type NotifyPemohonContextValue = {
  promptNotifyPemohon: (prompt: NotifyPemohonPrompt) => void;
};

const NotifyPemohonContext = createContext<NotifyPemohonContextValue | null>(null);

export function NotifyPemohonProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<NotifyPemohonPrompt | null>(null);

  const promptNotifyPemohon = useCallback((next: NotifyPemohonPrompt) => {
    setPrompt(next);
  }, []);

  const value = useMemo(
    () => ({ promptNotifyPemohon }),
    [promptNotifyPemohon],
  );

  function close() {
    setPrompt(null);
    router.refresh();
  }

  return (
    <NotifyPemohonContext.Provider value={value}>
      {children}
      <NotifyPemohonDialog
        open={Boolean(prompt)}
        href={prompt?.href ?? ""}
        decision={prompt?.decision ?? "approved"}
        onClose={close}
      />
    </NotifyPemohonContext.Provider>
  );
}

export function useNotifyPemohon() {
  const ctx = useContext(NotifyPemohonContext);
  if (!ctx) {
    throw new Error("useNotifyPemohon mesti digunakan dalam NotifyPemohonProvider.");
  }
  return ctx;
}
