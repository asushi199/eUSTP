import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { needsStaffAuth } from "@/lib/auth-paths";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Model public-first: kebanyakan halaman awam TIDAK melalui auth
 * (`needsStaffAuth`, lib/auth-paths.ts). Semakan peranan terperinci dibuat
 * dalam layout (admin) + lib/rbac.ts. Direktori USTP (/direktori/ustp) awam
 * tetapi kandungannya digate oleh akaun MOE-DL.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isStaff = !!req.auth && req.auth.user?.authKind !== "moe-dl";

  if (needsStaffAuth(pathname) && !isStaff) {
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
