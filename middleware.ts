import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Model public-first: kebanyakan halaman awam TIDAK melalui auth.
 * Pengecualian: /analisis dalaman sahaja (akaun staf). Semakan peranan
 * terperinci dibuat dalam layout (admin) + lib/rbac.ts. Direktori USTP
 * (/direktori/ustp) awam tetapi kandungannya digate oleh akaun MOE-DL.
 */
const PROTECTED_PREFIXES = ["/admin", "/analisis"];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isStaff = !!req.auth && req.auth.user?.authKind !== "moe-dl";

  if (needsAuth(pathname) && !isStaff) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/login") && isStaff) {
    return NextResponse.redirect(new URL("/admin/tempahan", req.nextUrl.origin));
  }

  if (
    isStaff &&
    req.auth?.user?.mustChangePassword &&
    !pathname.startsWith("/tukar-kata-laluan")
  ) {
    return NextResponse.redirect(new URL("/tukar-kata-laluan", req.nextUrl.origin));
  }

  if (pathname.startsWith("/tukar-kata-laluan") && !isStaff) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/analisis/:path*",
    "/login",
    "/tukar-kata-laluan",
  ],
};
