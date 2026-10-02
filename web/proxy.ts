import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET?.trim() ||
  (process.env.NODE_ENV !== "production"
    ? "dev-only-auth-secret-change-me"
    : undefined);

const PROTECTED_PAGES = [
  "/dashboard",
  "/formulations",
  "/saved-formulas",
  "/calculators",
  "/cogs",
  "/co2-calculations",
  "/shelf-life",
  "/ingredients",
  "/activity",
  "/settings",
  "/specifications",
  "/suppliers",
  "/chat",
  "/admin",
];

function matchesPrefix(path: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function isProtectedApi(path: string) {
  if (!path.startsWith("/api/")) {
    return false;
  }

  const publicApiPaths = [
    "/api/auth",
    "/api/health",
  ];
  return !matchesPrefix(path, publicApiPaths);
}

export async function proxy(req: NextRequest) {
  const token = AUTH_SECRET
    ? await getToken({ req, secret: AUTH_SECRET })
    : null;
  const isLoggedIn = Boolean(token);
  const path = req.nextUrl.pathname;
  const protectedPage = matchesPrefix(path, PROTECTED_PAGES);
  const protectedApi = isProtectedApi(path);

  if (protectedApi && !isLoggedIn) {
    return NextResponse.json(
      { error: { message: "Authentication required." } },
      { status: 401 },
    );
  }

  if (protectedPage && !isLoggedIn) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
