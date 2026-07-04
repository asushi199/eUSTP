import type { NextAuthConfig } from "next-auth";
import type { UserPeranan } from "./roles";

type AuthUserFields = {
  id: string;
  username: string;
  nama: string;
  jawatan: string;
  peranan: UserPeranan;
  pkgId: string | null;
  mustChangePassword: boolean;
};

function tokenString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function tokenPeranan(value: unknown): UserPeranan {
  return typeof value === "string" ? (value as UserPeranan) : "Pegawai";
}

function tokenPkgId(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Konfigurasi auth yang Edge-safe (untuk middleware).
 * JANGAN import db / bcrypt di sini — kedua-duanya tidak boleh jalan di Edge runtime.
 *
 * Model akses eUSTP: halaman awam terbuka; hanya /admin perlu log masuk.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin") || pathname.startsWith("/tukar-kata-laluan")) {
        return !!auth;
      }
      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = String(token.uid);
        session.user.username = tokenString(token.username);
        session.user.nama = tokenString(token.nama);
        session.user.jawatan = tokenString(token.jawatan);
        session.user.peranan = tokenPeranan(token.peranan);
        session.user.pkgId = tokenPkgId(token.pkgId);
        session.user.mustChangePassword =
          typeof token.mustChangePassword === "boolean" ? token.mustChangePassword : false;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const appUser = user as AuthUserFields;
        token.uid = Number(appUser.id);
        token.username = appUser.username;
        token.nama = appUser.nama;
        token.jawatan = appUser.jawatan;
        token.peranan = appUser.peranan;
        token.pkgId = appUser.pkgId;
        token.mustChangePassword = appUser.mustChangePassword;
      }
      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "boolean") {
          token.mustChangePassword = session.mustChangePassword;
        }
      }
      return token;
    },
  },
} satisfies NextAuthConfig;
