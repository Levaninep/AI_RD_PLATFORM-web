import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  createDevUser,
  findDevUserByEmail,
  isDatabaseUnavailable,
} from "@/lib/dev-data-store";
import { resolveUserRole } from "@/lib/admin-auth";
import { env } from "@/lib/env";

export const AUTH_SECRET = env.NEXTAUTH_SECRET;
const DEV_AUTH_COOKIE = "ai_rd_dev_user";
const ALLOW_DEV_AUTH_FALLBACK =
  !env.isProduction && env.ALLOW_DEV_NO_LOGIN === "true";

function isPrismaConnectionError(error: unknown): boolean {
  if (isDatabaseUnavailable(error)) {
    return true;
  }

  const name =
    error != null && typeof error === "object"
      ? String((error as { name?: unknown }).name ?? "")
      : "";
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";

  const combined = `${name} ${message}`.toLowerCase().replace(/\s+/g, " ");

  return (
    combined.includes("prismaclientinitializationerror") ||
    combined.includes("can't reach database server") ||
    combined.includes("cant reach database server") ||
    combined.includes("econnrefused")
  );
}

function parseCookieHeader(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const separator = entry.indexOf("=");
      if (separator <= 0) {
        return acc;
      }

      const key = entry.slice(0, separator).trim();
      const value = entry.slice(separator + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function findDevUserFromCookie(
  cookieHeader: string | undefined,
  email: string,
) {
  try {
    const cookies = parseCookieHeader(cookieHeader);
    const payload = cookies[DEV_AUTH_COOKIE];
    if (!payload) {
      return null;
    }

    const parsed = JSON.parse(decodeURIComponent(payload)) as {
      id?: string;
      email?: string;
      password?: string;
    };

    if (!parsed?.email || !parsed?.password || !parsed?.id) {
      return null;
    }

    if (parsed.email.trim().toLowerCase() !== email) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      password: parsed.password,
    };
  } catch {
    return null;
  }
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        let databaseUnavailable = false;

        if (!email || !password) {
          return null;
        }

        let user: { id: string; email: string; password: string } | null = null;

        try {
          user = await prisma.user.findUnique({
            where: { email },
          });
        } catch (error) {
          if (isPrismaConnectionError(error)) {
            databaseUnavailable = true;
            user = findDevUserByEmail(email);
            if (!user) {
              user = findDevUserFromCookie(req?.headers?.cookie, email);
            }

            if (!user && ALLOW_DEV_AUTH_FALLBACK) {
              const passwordHash = await hash(password, 12);
              const created = createDevUser({
                email,
                password: passwordHash,
              });

              if (!("error" in created)) {
                user = created;
              }
            }
          } else {
            throw error;
          }
        }

        if (!user) {
          return null;
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
          if (databaseUnavailable && ALLOW_DEV_AUTH_FALLBACK) {
            const passwordHash = await hash(password, 12);
            const reconciled = createDevUser({
              email,
              password: passwordHash,
            });

            if (!("error" in reconciled)) {
              user = reconciled;
            } else {
              return null;
            }
          } else {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
        };
    },
  }),
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  secret: AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.trim().toLowerCase();
      if (!email) {
        return false;
      }

      try {
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (!existingUser && resolveUserRole(email) !== "ADMIN") {
          return false;
        }

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email,
              password: await hash(randomBytes(32).toString("hex"), 12),
            },
          });
        }
        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }

      if (account?.provider === "google" && token.email) {
        const databaseUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          select: { id: true },
        });
        if (databaseUser) {
          token.sub = databaseUser.id;
        }
      }

      // Always resolve role from email so env var changes take effect
      token.role = resolveUserRole(token.email);

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
