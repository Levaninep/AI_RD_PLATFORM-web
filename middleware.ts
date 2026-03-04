import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/lib/env";

const AUTH_SECRET = env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  let token = null;

  try {
    token = await getToken({
      req,
      secret: AUTH_SECRET,
    });
  } catch {
    token = null;
  }

  const isLoggedIn = Boolean(token);
  const path = req.nextUrl.pathname;

  const protectedPaths = [
    "/dashboard",
    "/formulations",
    "/cogs",
    "/co2-calculations",
    "/admin",
  ];
  const isProtectedPath = protectedPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  const isDevelopment = !env.isProduction;

  if (isDevelopment && isProtectedPath) {
    return NextResponse.next();
  }

  if (isProtectedPath && !isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && (path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/formulations/:path*",
    "/cogs/:path*",
    "/co2-calculations/:path*",
    "/admin/:path*",
  ],
};
