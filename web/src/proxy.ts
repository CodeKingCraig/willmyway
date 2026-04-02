import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "auth_token";

function hasAuthCookie(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  return Boolean(token && token.length > 10);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = hasAuthCookie(req);

  // Redirect logged-in users away from login/register
  if (authed && (pathname === "/login" || pathname === "/register")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protect dashboard + will + legacy routes
  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/will/") ||
    pathname === "/legacy" ||
    pathname.startsWith("/legacy/");

  if (!authed && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/will/:path*", "/legacy", "/legacy/:path*", "/login", "/register"],
};