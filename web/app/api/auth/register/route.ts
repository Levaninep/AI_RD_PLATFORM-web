import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createDevUser, isDatabaseUnavailable } from "@/lib/dev-data-store";
import { env } from "@/lib/env";

type RegisterPayload = {
  email?: unknown;
  password?: unknown;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RegisterPayload | null;

  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body?.password ?? "");

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: { message: "Please provide a valid email address." } },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: { message: "Password must be at least 8 characters." } },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: { message: "Email is already registered." } },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (isPrismaConnectionError(error) && ALLOW_DEV_AUTH_FALLBACK) {
      const passwordHash = await hash(password, 12);
      const created = createDevUser({
        email,
        password: passwordHash,
      });

      if ("error" in created) {
        return NextResponse.json(
          { error: { message: created.error } },
          { status: created.error.includes("already") ? 409 : 400 },
        );
      }

      const response = NextResponse.json(
        {
          id: created.id,
          email: created.email,
          createdAt: created.createdAt,
        },
        { status: 201 },
      );

      response.cookies.set({
        name: DEV_AUTH_COOKIE,
        value: encodeURIComponent(
          JSON.stringify({
            id: created.id,
            email: created.email,
            password: passwordHash,
            createdAt: created.createdAt,
          }),
        ),
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });

      return response;
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Failed to register user.",
        },
      },
      { status: 500 },
    );
  }
}
