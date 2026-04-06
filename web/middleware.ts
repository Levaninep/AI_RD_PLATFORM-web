import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET?.trim();
const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";

function getSessionToken(req: NextRequest) {
  const cookieNames = [
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ];

  for (const cookieName of cookieNames) {
    const value = req.cookies.get(cookieName)?.value;
    if (value) {
      return value;
    }
  }

  return null;
}

export async function middleware(req: NextRequest) {
  let token = null;

  if (!IS_DEVELOPMENT && AUTH_SECRET) {
    token = getSessionToken(req);
  }

  const isLoggedIn = Boolean(token);
  const path = req.nextUrl.pathname;

  const protectedPaths = ["/admin"];
  const isProtectedPath = protectedPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (IS_DEVELOPMENT && isProtectedPath) {
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
