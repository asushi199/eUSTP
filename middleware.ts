import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Model public-first: kebanyakan halaman awam TIDAK melalui auth.
 * Pengecualian: modul OSC (/osc, /sumber, /analisis, /maklumat-asas) kini
 * dalaman sahaja — hanya boleh dilihat selepas log masuk (arahan pengurusan:
 * "OSC tidak boleh dilihat orang luar"). Semakan peranan terperinci dibuat
 * dalam layout (admin) + lib/rbac.ts.
 */
const PROTECTED_PREFIXES = ["/admin", "/osc", "/sumber", "/analisis", "/maklumat-asas"];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (needsAuth(pathname) && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/login") && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/tempahan", req.nextUrl.origin));
  }

  if (
    isLoggedIn &&
    req.auth?.user?.mustChangePassword &&
    !pathname.startsWith("/tukar-kata-laluan")
  ) {
    return NextResponse.redirect(new URL("/tukar-kata-laluan", req.nextUrl.origin));
  }

  if (pathname.startsWith("/tukar-kata-laluan") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/osc/:path*",
    "/sumber/:path*",
    "/analisis/:path*",
    "/maklumat-asas/:path*",
    "/login",
    "/tukar-kata-laluan",
  ],
};
