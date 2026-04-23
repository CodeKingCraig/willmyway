import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AUTH_COOKIE_NAME = "auth_token";

function getAuthToken(req: NextRequest) {
  return req.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = getAuthToken(req);

  let authed = false;
  let role: "OWNER" | "WITNESS" | "ADMIN" | null = null;
  let basePlan: "ESSENTIAL" | "LEGACY" | "FAMILY_VAULT" | "FULL" | null = null;
  let careActive = false;
  let careStatus: "NOT_ACTIVE" | "ACTIVE" | "CANCELLED" | "EXPIRED" | null = null;

  if (token) {
    const payload = verifyAuthToken(token);

    if (payload?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId as string },
        select: {
          role: true,
          basePlan: true,
          careActive: true,
          careStatus: true,
        },
      });

      if (user) {
        authed = true;
        role = user.role;
        basePlan = user.basePlan;
        careActive = user.careActive;
        careStatus = user.careStatus;
      }
    }
  }

  // Redirect logged-in users away from login/register
  if (authed && (pathname === "/login" || pathname === "/register")) {
    const url = req.nextUrl.clone();
    url.pathname = role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLegacyRoute = pathname === "/legacy" || pathname.startsWith("/legacy/");

  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/will/") ||
    isLegacyRoute ||
    isAdminRoute;

  if (!authed && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (authed && isAdminRoute && role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (authed && isLegacyRoute) {
    const hasLegacyAccess =
      basePlan === "LEGACY" ||
      basePlan === "FAMILY_VAULT" ||
      basePlan === "FULL";

    if (!hasLegacyAccess) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("upgrade", "legacy");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/will/:path*",
    "/legacy",
    "/legacy/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
