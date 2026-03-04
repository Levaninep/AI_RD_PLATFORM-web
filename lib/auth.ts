import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  findDevUserByEmail,
  isDatabaseUnavailable,
} from "@/lib/dev-data-store";
import { resolveUserRole } from "@/lib/admin-auth";
import { env } from "@/lib/env";

export const AUTH_SECRET = env.NEXTAUTH_SECRET;

export const authOptions: NextAuthOptions = {
  secret: AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          return null;
        }

        let user: { id: string; email: string; password: string } | null = null;

        try {
          user = await prisma.user.findUnique({
            where: { email },
          });
        } catch (error) {
          if (isDatabaseUnavailable(error)) {
            user = findDevUserByEmail(email);
          } else {
            throw error;
          }
        }

        if (!user) {
          return null;
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = resolveUserRole(user.email);
      }

      if (!token.role) {
        token.role = resolveUserRole(token.email);
      }

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
