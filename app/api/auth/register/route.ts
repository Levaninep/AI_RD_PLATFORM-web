import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createDevUser, isDatabaseUnavailable } from "@/lib/dev-data-store";

type RegisterPayload = {
  email?: unknown;
  password?: unknown;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    if (isDatabaseUnavailable(error)) {
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

      return NextResponse.json(
        {
          id: created.id,
          email: created.email,
          createdAt: created.createdAt,
        },
        { status: 201 },
      );
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
