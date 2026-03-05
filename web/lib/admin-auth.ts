import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
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
    .split(/[;,\s]+/)
    .map((item) =>
      item
        .trim()
        .toLowerCase()
        .replace(/^['"]|['"]$/g, ""),
    )
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
