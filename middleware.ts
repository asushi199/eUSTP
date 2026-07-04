import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Model public-first: semua halaman awam TIDAK melalui auth
 * (matcher hanya padan /admin, /login dan /tukar-kata-laluan).
 * Semakan peranan terperinci dibuat dalam layout (admin) + lib/rbac.ts.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith("/admin") && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/login") && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
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
  matcher: ["/admin/:path*", "/login", "/tukar-kata-laluan"],
};
