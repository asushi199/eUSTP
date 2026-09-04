import type { NextAuthConfig } from "next-auth";
import { isMoeDlEmail, type AuthKind } from "./moe-dl";
import { isKnownPeranan, type UserPeranan } from "./roles";

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

function tokenPeranan(value: unknown): UserPeranan | undefined {
  return typeof value === "string" && isKnownPeranan(value) ? value : undefined;
}

function tokenPkgId(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function tokenAuthKind(value: unknown): AuthKind {
  return value === "moe-dl" ? "moe-dl" : "staff";
}

/**
 * Konfigurasi auth yang Edge-safe (untuk middleware).
 * JANGAN import db / bcrypt di sini — kedua-duanya tidak boleh jalan di Edge runtime.
 *
 * Model akses NEXa: halaman awam terbuka; hanya /admin perlu log masuk staf.
 * Akaun Google MOE-DL hanya untuk melihat nombor telefon direktori.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/direktori/log-masuk",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        return isMoeDlEmail(user.email);
      }
      return true;
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin") || pathname.startsWith("/tukar-kata-laluan")) {
        return auth?.user?.authKind !== "moe-dl" && !!auth;
      }
      return true;
    },
    async session({ session, token }) {
      if (token) {
        const authKind = tokenAuthKind(token.authKind);
        session.user.id = String(token.uid ?? "");
        session.user.authKind = authKind;
        session.user.username = tokenString(token.username);
        session.user.nama = tokenString(token.nama);
        session.user.jawatan = tokenString(token.jawatan);
        session.user.peranan = tokenPeranan(token.peranan);
        session.user.pkgId = tokenPkgId(token.pkgId);
        session.user.mustChangePassword =
          typeof token.mustChangePassword === "boolean" ? token.mustChangePassword : false;
        if (authKind === "moe-dl") {
          session.user.email = tokenString(token.username);
        }
      }
      return session;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user && account?.provider === "google") {
        const email = (user.email ?? "").trim().toLowerCase();
        token.authKind = "moe-dl";
        token.uid = 0;
        token.username = email;
        token.nama = user.name ?? email;
        token.jawatan = "Akaun MOE-DL";
        token.peranan = undefined;
        token.pkgId = null;
        token.mustChangePassword = false;
        return token;
      }
      if (user) {
        const appUser = user as AuthUserFields;
        token.authKind = "staff";
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
