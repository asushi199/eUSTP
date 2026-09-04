import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { canManageKandungan, canManageTempahan, isKnownPeranan } from "./roles";
import type { UserPeranan } from "./roles";

export type SessionUser = Session["user"];
export type StaffUser = SessionUser & { authKind: "staff"; peranan: UserPeranan };

export async function requireUser(): Promise<StaffUser> {
  const session = (await auth()) as Session | null;
  if (!session?.user) redirect("/login");
  if (session.user.authKind === "moe-dl") redirect("/direktori");
  if (!isKnownPeranan(session.user.peranan ?? "")) redirect("/login");
  return session.user as StaffUser;
}

/** Laporan DPD/PSS + Direktori (admin) — Admin dan Pegawai sahaja. */
export async function requireKandunganAccess(): Promise<SessionUser> {
  const user = await requireUser();
  if (!canManageKandungan(user.peranan)) redirect("/admin");
  return user;
}

/**
 * Tempahan (admin). PKG_Admin hanya boleh urus PKG sendiri;
 * Admin/Pegawai boleh urus semua PKG.
 */
export async function requireTempahanAccess(pkgId: string): Promise<SessionUser> {
  const user = await requireUser();
  if (!canManageTempahan(user.peranan)) redirect("/admin");
  if (user.peranan === "PKG_Admin" && user.pkgId !== pkgId) redirect("/admin");
  return user;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = (await auth()) as Session | null;
  return session?.user ?? null;
}
