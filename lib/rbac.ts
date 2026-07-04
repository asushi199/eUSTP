import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import {
  canManageKandungan,
  canManageTempahan,
  canManageUsers,
  isFullAdmin,
} from "./roles";

export type SessionUser = Session["user"];

export async function requireUser(): Promise<SessionUser> {
  const session = (await auth()) as Session | null;
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Pentadbir penuh — pengurusan pengguna dll. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isFullAdmin(user.peranan)) redirect("/admin");
  return user;
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

export async function requireUserManagement(): Promise<SessionUser> {
  const user = await requireUser();
  if (!canManageUsers(user.peranan)) redirect("/admin");
  return user;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = (await auth()) as Session | null;
  return session?.user ?? null;
}
