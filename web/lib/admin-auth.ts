import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { getToken, type JWT } from "next-auth/jwt";
import { env } from "@/lib/env";

export type AppRole = "ADMIN" | "USER";

export function isDevAuthBypassEnabled(): boolean {
  return !env.isProduction && env.ALLOW_DEV_NO_LOGIN !== "false";
}

function parseAdminEmails(): Set<string> {
  const raw = [env.ADMIN_EMAIL, env.ADMIN_EMAILS]
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .join(",");
  const values = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set(values);
}

export function resolveUserRole(email?: string | null): AppRole {
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  const adminEmails = parseAdminEmails();

  if (!normalizedEmail) {
    return "USER";
  }

  if (adminEmails.has(normalizedEmail)) {
    return "ADMIN";
  }

  return "USER";
}

export function isAdminSession(session: Session | null): boolean {
  if (isDevAuthBypassEnabled()) {
    return true;
  }

  if (!session?.user) {
    return false;
  }

  if (session.user.role === "ADMIN") {
    return true;
  }

  return resolveUserRole(session.user.email) === "ADMIN";
}

export function isAdminToken(token: JWT | null): boolean {
  console.log(
    "[isAdminToken] devBypass:",
    isDevAuthBypassEnabled(),
    "token:",
    !!token,
    "role:",
    token?.role,
    "email:",
    token?.email,
  );
  console.log(
    "[isAdminToken] ADMIN_EMAIL env:",
    JSON.stringify(env.ADMIN_EMAIL),
    "ADMIN_EMAILS env:",
    JSON.stringify(env.ADMIN_EMAILS),
  );

  if (isDevAuthBypassEnabled()) {
    return true;
  }

  if (!token) {
    return false;
  }

  if (token.role === "ADMIN") {
    return true;
  }

  const tokenEmail = typeof token.email === "string" ? token.email : null;
  return resolveUserRole(tokenEmail) === "ADMIN";
}

export async function getAuthTokenFromRequest(req: NextRequest) {
  const authRequest = {
    headers: {
      authorization: req.headers.get("authorization") ?? "",
      cookie: req.headers.get("cookie") ?? "",
    },
  } as Parameters<typeof getToken>[0]["req"];

  return getToken({
    req: authRequest,
    secret: env.NEXTAUTH_SECRET,
  });
}
