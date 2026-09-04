import "server-only";

import { auth } from "@/lib/auth";
import type { AuthKind } from "@/lib/moe-dl";
import { isKnownPeranan } from "@/lib/roles";

export type DirectoryContactAccess = {
  ok: boolean;
  authKind: AuthKind | null;
  nama: string;
  email: string;
};

export async function getDirectoryContactAccess(): Promise<DirectoryContactAccess> {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    return { ok: false, authKind: null, nama: "", email: "" };
  }

  if (user.authKind === "moe-dl") {
    return {
      ok: true,
      authKind: "moe-dl",
      nama: user.nama || user.name || "",
      email: user.email || user.username || "",
    };
  }

  if (user.peranan && isKnownPeranan(user.peranan)) {
    return {
      ok: true,
      authKind: "staff",
      nama: user.nama,
      email: user.username,
    };
  }

  return { ok: false, authKind: null, nama: "", email: "" };
}
