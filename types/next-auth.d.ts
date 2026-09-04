import type { DefaultSession } from "next-auth";
import type { AuthKind } from "@/lib/moe-dl";
import type { UserPeranan } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      authKind: AuthKind;
      username: string;
      nama: string;
      jawatan: string;
      peranan?: UserPeranan;
      pkgId: string | null;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    nama?: string;
    jawatan?: string;
    peranan?: UserPeranan;
    pkgId?: string | null;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: number;
    authKind?: AuthKind;
    username?: string;
    nama?: string;
    jawatan?: string;
    peranan?: UserPeranan;
    pkgId?: string | null;
    mustChangePassword?: boolean;
  }
}
